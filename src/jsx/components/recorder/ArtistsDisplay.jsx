import * as React from 'react';
import PropTypes from 'prop-types';
import * as SpotifyProps from '../../props/spotify';
import { insertBetween } from '../../utils';

export default class ArtistsDisplay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let artists = this.props.artists;

    let artistElems = artists.map((artist, i) => {
      return (
        this.props.is_local
          ? artist.name
          : <a key={`record-artist${i}`} href={artist.uri}>{artist.name}</a>
      );
    });
    artistElems = insertBetween(artistElems, ', ');

    return (<div className="record-artist">{artistElems}</div>);
  }
}

ArtistsDisplay.propTypes = {
  artists: PropTypes.arrayOf(SpotifyProps.Artist),
  is_local: PropTypes.bool.isRequired
};
