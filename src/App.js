import React, { Component } from 'react';
import numeral from 'numeral';
import Map from './components/GoogleMaps';
import { getBuildings } from './rest';

const copenhagenLocation = {
  lat: 55.6760968,
  lng: 12.568337199999974
};

class App extends Component {
  state = {
    buildings: [],
    center: copenhagenLocation
  };

  async componentDidMount() {
    const response = await getBuildings({
      lat: this.state.center.lat,
      lon: this.state.center.lng,
      distance: 5
    });
    this.setState({ buildings: response.hits.hits });
  }

  async componentWillUpdate(nextProps, nextState) {
    if (this.state.center !== nextState.center) {
      const response = await getBuildings({
        lat: this.state.center.lat,
        lon: this.state.center.lng,
        distance: 5
      });
      this.setState({ buildings: response.hits.hits });
    }
  }

  onBoundsChanged = ({ center }) => {
    this.setState({
      center: {
        lat: center.lat(),
        lng: center.lng()
      }
    });
  };

  getMarkers = () => {
    return this.state.buildings.map(building => {
      return {
        text: `${numeral(building._source.sales[0].price).format('0.0 a')} kr.`,
        location: {
          lat: building._source.location.lat,
          lng: building._source.location.lon
        }
      };
    });
  };

  render() {
    return (
      <Map
        center={this.state.center}
        markers={this.getMarkers()}
        onBoundsChanged={this.onBoundsChanged}
      />
    );
  }
}

export default App;
