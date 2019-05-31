import * as React from 'react';
import PropTypes from 'prop-types';
import { sprintf } from 'sprintf-js';
import * as SpotifyProps from '../../props/spotify';
import ArtistDisplay from '../song/ArtistDisplay';
import CoverDisplay from '../song/CoverDisplay';
import AlbumDisplay from '../song/AlbumDisplay';
import TrackDisplay from '../song/TrackDisplay';

export default class RecordDisplay extends React.Component {
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

      return (
      <div className="track-display">
        <CoverDisplay is_local={track.is_local} covers={covers} link={track.uri} />
        <TrackDisplay is_local={track.is_local} name={track.name} link={track.uri} />
        <div className="record-time"><p>{timeString}</p></div>
        <ArtistDisplay is_local={track.is_local} artists={artists} />
        <AlbumDisplay is_local={track.is_local} name={album.name} link={album.uri} />
      </div>
      );
    }
  }
}

// React properties documentation

RecordDisplay.propTypes = {
  displayData: PropTypes.oneOfType([
    // regular text
    PropTypes.string,
    // currently playing object
    SpotifyProps.CurrentlyPlaying
  ]).isRequired,
  err: PropTypes.instanceOf(Error)
};
