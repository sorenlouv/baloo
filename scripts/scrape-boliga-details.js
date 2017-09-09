const cheerio = require('cheerio');
const delay = require('delay');
const axios = require('axios');
const elasticsearch = require('elasticsearch');

const client = new elasticsearch.Client({
  host: 'localhost:9200'
});

function getResales(data) {
  const $ = cheerio.load(data);

  return $('.content table')
    .first()
    .find('.zebra-striped tr')
    .slice(1)
    .map((i, row) => {
      const cells = $(row)
        .find('td')
        .map((i, cell) => {
          const a = $(cell)
            .text()
            .trim();

          return a;
        })
        .toArray();

      const [day, month, year] = cells[1].split('-');
      const date = new Date(year, month - 1, day);
      const price = parseInt(cells[2].replace(/[^0-9]/g, ''), 10);

      return {
        date,
        price,
        type: cells[3]
      };
    })
    .toArray();
}

function getLocation(sqren) {
  const [, lat, lon] = sqren.match(/LatLng\((.*)+, (.*)\);/) || [];
  if (lat && lon) {
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
  }
}

function getLocationAndResales(url) {
  return axios
    .get(`http://www.boliga.dk${url}`, {
      timeout: 10000
    })
    .then(res => {
      console.log('Fetching ', url);
      const resales = getResales(res.data, url);
      const location = getLocation(res.data);

      return { location, resales };
    });
}

function updateDoc({ id, location, resales }) {
  return client.update({
    index: 'baloo',
    type: 'buildings',
    id,
    body: {
      doc: {
        location,
        sales: resales
      }
    }
  });
}

function retry(maxAttempts, handler, ...args) {
  function retrying(attemptCount) {
    return handler(...args).catch(e => {
      console.error(e);
      if (attemptCount <= maxAttempts) {
        return delay(1000).then(() => retrying(attemptCount + 1));
      }
    });
  }

  return retrying(0);
}

let scrolledHits = 0;
const processResponse = ({ _scroll_id: scrollId, hits }) => {
  scrolledHits += hits.hits.length;
  const promises = hits.hits.map(hit => {
    return retry(
      5,
      getLocationAndResales,
      hit._source.url
    ).then(({ location, resales }) => {
      console.log('Updating', hit._id, location, resales.length);
      return updateDoc({ id: hit._id, location, resales });
    });
  });

  return Promise.all(promises).then(() => {
    if (hits.total > scrolledHits) {
      console.log('next scroll', scrolledHits);
      return client.scroll({ scrollId, scroll: '5s' }).then(processResponse);
    }
    console.log('no next?', scrolledHits, hits.total);
  });
};

function init() {
  client
    .search({
      index: 'baloo',
      type: 'buildings',
      scroll: '5s',
      _source: 'url',
      body: {
        query: {
          bool: {
            must_not: {
              exists: {
                field: 'location'
              }
            }
          }
        }
      }
    })
    .then(processResponse)
    .then(() => {
      console.log('finished');
    })
    .catch(e => {
      console.error(e);
    });
}

init();

// getLocationAndResales(
//   '/salg/info/400/96007/EA86E438-8B58-40DB-AACB-AC8624D7A721'
// )
//   .then(({ location, resales }) => {
//     console.log(location, resales);
//     return updateDoc({ id: 1, location, resales });
//   })
//   .catch(e => {
//     console.error(e);
//   });
