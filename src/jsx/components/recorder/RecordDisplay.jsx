import * as React from 'react';
import PropTypes from 'prop-types';
import { sprintf } from 'sprintf-js';
import * as SpotifyProps from '../../props/spotify';
import ArtistsDisplay from './ArtistsDisplay';

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
      // TODO pick an actual one, don't just default to the first one
      // get album cover source
      let coverUrl = track.is_local ? '/public/assets/local-file.svg' : covers[0].url;

      let albumDisplayElem = <img className="record-cover" src={coverUrl}></img>;

      if (!track.is_local) {
        albumDisplayElem = <a href={track.uri}>{albumDisplayElem}</a>;
      }

      return (
      <div className="trackDisplay">
        {albumDisplayElem}
        <div className="record-track">
          {track.is_local ? track.name : <a href={track.uri}>{track.name}</a>}
        </div>
        <div className="record-time"><p>{timeString}</p></div>
        <ArtistsDisplay is_local={track.is_local} artists={artists} />
        <div className="record-album">
          {track.is_local ? album.name : <a href={album.uri}>{album.name}</a>}
        </div>
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
