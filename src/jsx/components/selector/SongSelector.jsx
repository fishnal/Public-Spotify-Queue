import * as React from 'react';
import * as PropTypes from 'prop-types';
import SimpleBar from 'simplebar-react';
import * as SpotifyWebApiExport from 'spotify-web-api-js';
import PlaylistSelector from './PlaylistSelector';

const SpotifyWebApi = SpotifyWebApiExport.default;

export default class SongSelector extends React.Component {
  constructor(props) {
    super(props);

    this.getSongs = this.getSongs.bind(this);
    this.goBack = this.goBack.bind(this);
    this.play = this.play.bind(this);

    let backButton = (
    <div key="back-button" onClick={this.goBack} className="back-button">
      <div className="song-name">BACK</div>
    </div>);

    let playButton = (
    <div key="play-button" onClick={this.play} className="play-button">
      <div className="song-name">PLAY</div>
    </div>
    );

    this.state = {
      songElems: [ backButton, playButton ],
      finishedGrabbing: false,
      offset: 0,
      err: null,
      goBack: false
    }
  }

  goBack() {
    this.setState({
      ...this.state,
      goBack: true
    });
  }

  play() {
    this.props.spotifyApi.play({
      context_uri: this.props.contextUri
    }).catch((err) => {
      console.error(err);
      this.setState({
        err
      });
    });
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

      if (this.state.goBack) {
        return (<PlaylistSelector spotifyApi={this.props.spotifyApi} asyncController={null} />);
      } else if (this.state.songElems.length === 0) {
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
  contextUri: PropTypes.string.isRequired,
  spotifyApi: PropTypes.instanceOf(SpotifyWebApi).isRequired,
  playlistId: PropTypes.string.isRequired
}