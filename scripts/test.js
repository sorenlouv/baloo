const promiseRetry = require('promise-retry');
const axios = require('axios');

promiseRetry(
  (retry, number) => {
    console.log('attempt number', number);
    return axios(
      'http://www.boliga.dk/salg/info/461/601952/E9FDB71E-19EB-44C4-942B-07F2FA86EE85'
    ).catch(e => {
      if (e.response.status === 500) {
        throw e;
      }
      retry(e);
    });
  },
  { retries: 2 }
)
  .then(value => {
    console.log('yay', value);
  })
  .catch(e => {
    console.log(e);
  });
