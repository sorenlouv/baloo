/* global google */
import React, { Component } from 'react';
import {
  withGoogleMap,
  GoogleMap,
  Marker,
  InfoWindow
} from 'react-google-maps';

class InnerMap extends Component {
  onBoundsChanged = () => {
    if (!this.ref) {
      return;
    }

    this.props.onBoundsChanged({
      zoom: this.ref.getZoom(),
      bounds: this.ref.getBounds(),
      center: this.ref.getCenter()
    });
  };

  render() {
    const { center, markers = [], onBoundsChanged } = this.props;

    return (
      <GoogleMap
        ref={ref => {
          this.ref = ref;
        }}
        defaultZoom={12}
        defaultCenter={center}
        onBoundsChanged={this.onBoundsChanged}
      >
        {markers.map((marker, i) => (
          <Marker key={i} position={marker.location}>
            <InfoWindow>
              <div>
                <strong>{marker.text}</strong>
              </div>
            </InfoWindow>
          </Marker>
        ))}
      </GoogleMap>
    );
  }
}

const InnerMapHOC = withGoogleMap(InnerMap);

export default function Map({ center, markers = [], onBoundsChanged }) {
  console.log('1', markers);
  return (
    <InnerMapHOC
      onBoundsChanged={onBoundsChanged}
      center={center}
      markers={markers}
      containerElement={<div />}
      mapElement={
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%'
          }}
        />
      }
    />
  );
}
