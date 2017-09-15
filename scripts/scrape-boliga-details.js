const cheerio = require('cheerio');
const axios = require('axios');
const elasticsearch = require('elasticsearch');
const _ = require('lodash');
const retry = require('promise-retry');

const client = new elasticsearch.Client({
  host: 'localhost:9201'
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
  console.log('Fetching ', url);
  return axios
    .get(`http://www.boliga.dk${url}`, {
      timeout: 10000
    })
    .then(res => {
      console.log('Finished fetching', url);
      const resales = getResales(res.data, url);
      const location = getLocation(res.data);

      return { location, resales };
    })
    .catch(e => {
      console.error('An error occured while fetching', url);
      throw e;
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
        sales: resales,
        updated: Date.now()
      }
    }
  });
}

let scrolledHits = 0;
const processResponse = ({ _scroll_id: scrollId, hits }) => {
  scrolledHits += hits.hits.length;
  const promises = hits.hits.map(hit => {
    return retry(
      (retry, retryCount) => {
        if (retryCount > 1) {
          console.log(`Retry #${retryCount - 1}`);
        }
        return getLocationAndResales(hit._source.url).catch(e => {
          const status = _.get(e, 'response.status');
          if (status === 500) {
            throw e;
          }
          retry(e);
        });
      },
      { retries: 3 }
    ).then(({ location, resales }) => {
      console.log('Updating', hit._id, location, resales.length);
      return updateDoc({ id: hit._id, location, resales });
    });
  });

  return Promise.all(promises)
    .catch(e => {
      const status = _.get(e, 'response.status');
      const path = _.get(e, 'request.path');
      console.log('One or more did not succeed');
      console.error(`${e.message}. Status: ${status} for ${path}`);
    })
    .then(() => {
      if (hits.total > scrolledHits) {
        console.log('next scroll', scrolledHits);
        return client.scroll({ scrollId, scroll: '20s' }).then(processResponse);
      }
      console.log('no next?', scrolledHits, hits.total);
    })
    .then(() => {
      console.log('Processed all. Finishing');
    });
};

function init() {
  client
    .search({
      size: 30,
      index: 'baloo',
      type: 'buildings',
      scroll: '20s',
      _source: 'url',
      body: {
        query: {
          bool: {
            must_not: {
              exists: {
                field: 'updated'
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
      console.log('stopped');
      console.error(e);
    });
}

init();

// getLocationAndResales(
//   '/salg/info/461/601952/E9FDB71E-19EB-44C4-942B-07F2FA86EE85'
// )
//   .then(({ location, resales }) => {
//     console.log(location, resales);
//     return updateDoc({ id: 1, location, resales });
//   })
//   .catch(e => {
//     console.error(e);
//   });
