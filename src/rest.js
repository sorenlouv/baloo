import elasticsearch from 'elasticsearch';

const client = new elasticsearch.Client({
  host: 'localhost:3000'
});

export function getBuildings({ lat, lon, distance = 1 }) {
  console.log(lat, lon, distance);
  return client.search({
    size: 30,
    index: 'baloo',
    type: 'buildings',
    body: {
      query: {
        geo_distance: {
          distance: `${distance}km`,
          location: { lat, lon }
        }
      }
    }
  });
}

export function test() {
  return 'a';
}
