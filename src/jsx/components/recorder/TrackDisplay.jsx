import * as React from 'react';
import PropTypes from 'prop-types';
import { sprintf } from 'sprintf-js';
import * as SpotifyProps from '../../props/spotify';
import ArtistsDisplay from './ArtistsDisplay';

export default class TrackDisplay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (Object(this.props.displayData) instanceof String) {
      return (<p className={this.props.err ? 'error' : ''}>{this.props.displayData}</p>);
    } else {
      let data = this.props.displayData;
      let time = data.progress_ms;
      let track = data.item;
      let artists = track.artists;
      let album = track.album;
      let covers = album.images;

      // get mins and secs from ms time
      let mins = parseInt(time / 60000);
      let secs = parseInt((time - mins * 60000) / 1000);
      let timeString = sprintf('[%d:%02d]', mins, secs);
      // TODO pick an actual one, don't just default to the first one
      // get album cover source
      let coverUrl = covers[0].url;

      return (
      <div className="trackDisplay">
        <img className="cover" src={coverUrl}></img>
        <div className="track"><a href={track.uri}>{track.name}</a></div>
        <div className="time"><p>{timeString}</p></div>
        <ArtistsDisplay artists={artists} />
        <div className="album"><a href={album.uri}>{album.name}</a></div>
      </div>
      );
    }
  }
}

// React properties documentation

TrackDisplay.propTypes = {
  displayData: PropTypes.oneOfType([
    // regular text
    PropTypes.string,
    // currently playing object
    SpotifyProps.CurrentlyPlaying
  ]).isRequired,
  err: PropTypes.instanceOf(Error)
};
