const promiseRetry = require('promise-retry');

promiseRetry(
  (retry, number) => {
    console.log('attempt number', number);
    return Promise.reject('nooo').catch(retry);
  },
  { retries: 2 }
)
  .then(value => {
    console.log('yay', value);
  })
  .catch(e => {
    console.log(e);
  });
