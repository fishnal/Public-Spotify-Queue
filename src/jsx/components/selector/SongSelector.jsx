import * as React from 'react';
import * as PropTypes from 'prop-types';
import SimpleBar from 'simplebar-react';
import * as SpotifyWebApiExport from 'spotify-web-api-js';
import Loading from '../Loading';

const SpotifyWebApi = SpotifyWebApiExport.default;

export default class SongSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songElems: [],
      finishedGrabbing: false,
      offset: 0,
      err: null
    }

    this.getSongs = this.getSongs.bind(this);
  }

  getSongs() {
    this.props.spotifyApi.getPlaylistTracks(this.props.playlistId, { offset: this.state.offset, limit: 100 })
    .then((data) => {
      let newSongElems = data.items.map((song, i) => {
        let name = song.track.name;
        let uri = song.track.uri;

        let nameElem = <div className="song-name">{name}</div>
        let itemElem = <a key={`song-item-${i + this.state.offset}`} href={uri} className="song-item">{nameElem}</a>

        return itemElem;
      });
      let newOffset = this.state.offset + data.items.length;

      this.setState({
        songElems: this.state.songElems.concat(newSongElems),
        offset: newOffset,
        finishedGrabbing: newOffset === data.total
      });
    }).catch((err) => {
      console.error(err);
      this.setState({
        err
      });
    });
  }

  render() {
    if (this.state.err) {
      return (<p className="error">{`Error in retrieving songs: ${this.state.err}`}</p>);
    } else {
      if (!this.state.finishedGrabbing) {
        this.getSongs();
      }

      if (this.state.songElems.length === 0) {
        return (
        <div className="list-container pt-message">
          {this.state.finishedGrabbing ? 'No songs in playlist' : 'Retrieving songs'}
        </div>
        );
      } else {
        return (
        <SimpleBar className="list-container">
          {this.state.songElems}
        </SimpleBar>
        );
      }
    }
  }
}

SongSelector.propTypes = {
  spotifyApi: PropTypes.instanceOf(SpotifyWebApi).isRequired,
  playlistId: PropTypes.string.isRequired
}