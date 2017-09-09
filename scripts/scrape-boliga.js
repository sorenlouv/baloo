const cheerio = require('cheerio');
const axios = require('axios');
const elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  host: 'localhost:9200'
});

function getBoligaData(page) {
  return axios.get(
    `http://www.boliga.dk/salg/resultater?so=1&sort=omregnings_dato-a&maxsaledate=today&iPostnr=&gade=&type=&minsaledate=1992&p=${page}`
  );
}

function getAddress(fullAddresss) {
  const [, street, zipcode, city] =
    fullAddresss.match(/(.*),(\d{4})\s{1}(.*)/) || [];

  if (!street) {
    return { street: fullAddresss };
  }

  return { street, zipcode, city };
}

function processResponseData(salesData) {
  const $ = cheerio.load(salesData);
  return $('.searchResultTable tbody tr')
    .map((i, row) => {
      const cells = $(row)
        .find('td')
        .map((i, cell) => {
          return $(
            $(cell)
              .html()
              .replace('<br>', ',')
          )
            .text()
            .trim();
        })
        .toArray();

      const url = $(row)
        .find('td a')
        .attr('href');
      const [dateString, saleType] = cells[2].split(',');
      const [day, month, year] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      const { street, zipcode, city } = getAddress(cells[0]);
      const price = parseInt(cells[1].replace(/[^0-9]/g, ''), 10);

      return [
        { index: { _index: 'baloo', _type: 'buildings' } },
        {
          street,
          zipcode: parseInt(zipcode, 10),
          city,
          sales: [{ date, price, type: saleType }],
          roomCount: parseInt(cells[4], 10),
          houseType: cells[5],
          size: parseInt(cells[6], 10),
          year: parseInt(cells[7], 10),
          url
        }
      ];
    })
    .toArray();
}

let retryCount = 0;
function processPage(page) {
  return getBoligaData(page)
    .then(res => {
      const sales = processResponseData(res.data);

      console.log(
        `Opening page: ${page} and has currently indexed ${page * 40} sales`
      );

      return client
        .bulk({ body: sales })
        .then(() => {
          retryCount = 0;
          console.log('data was inserted for page', page);
        })
        .then(() => processPage(page + 1));
    })
    .catch(err => {
      console.error('An error occurred while fetching from boliga.');
      console.error(err);
      if (retryCount < 5) {
        console.log(`Retry #${retryCount}`);
        retryCount++;
        return processPage(page);
      }
    });
}

processPage(0)
  .then(() => {
    console.log('done');
  })
  .catch(err => {
    console.error(err);
  });
