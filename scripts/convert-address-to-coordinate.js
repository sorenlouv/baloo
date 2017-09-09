const config = require('./config.json');
const googleMapsClient = require('@google/maps').createClient({
  key: config.googleMapsKey
});

googleMapsClient.geocode(
  {
    address: '1600 Amphitheatre Parkway, Mountain View, CA'
  },
  (err, response) => {
    if (!err) {
      console.log(JSON.stringify(response.json.results, null, 4));
    }
  }
);

// https://maps.googleapis.com/maps/api/geocode/json?address=1600%20Amphitheatre%20Parkway
