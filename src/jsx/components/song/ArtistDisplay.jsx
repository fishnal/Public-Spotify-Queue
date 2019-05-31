import * as React from 'react';
import PropTypes from 'prop-types';
import * as SpotifyProps from '../../props/spotify';
import { insertBetween } from '../../utils';

export default class ArtistDisplay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let artists = this.props.artists;

    let artistElems = artists.map((artist, i) => {
      return (
        this.props.is_local
          ? <div key={`record-artist${i}`}>{artist.name}</div>
          : <a key={`record-artist${i}`} href={artist.uri}>{artist.name}</a>
      );
    });
    artistElems = insertBetween(artistElems, ', ');

    if (artistElems.length == 0) {
      artistElems = 'Local Artist'
    }

    return (<div className="record-artist">{artistElems}</div>);
  }
}

ArtistDisplay.propTypes = {
  artists: PropTypes.arrayOf(SpotifyProps.Artist),
  is_local: PropTypes.bool.isRequired
};
