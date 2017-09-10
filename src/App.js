/* global google */
import React from 'react';
import {
  withGoogleMap,
  GoogleMap,
  Marker,
  InfoWindow
} from 'react-google-maps';

const copenhagenLocation = { lat: 55.6760968, lng: 12.568337199999974 };

const SimpleMapExampleGoogleMap = withGoogleMap(props => (
  <GoogleMap defaultZoom={12} defaultCenter={copenhagenLocation}>
    <Marker position={copenhagenLocation}>
      <InfoWindow>
        <div>
          <strong>HEY!</strong>
        </div>
      </InfoWindow>
    </Marker>
  </GoogleMap>
));

function App() {
  return (
    <SimpleMapExampleGoogleMap
      containerElement={
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        />
      }
      mapElement={
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      }
    />
  );
}

export default App;
