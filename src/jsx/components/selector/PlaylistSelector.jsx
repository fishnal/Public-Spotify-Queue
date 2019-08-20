import * as React from 'react';
import * as PropTypes from 'prop-types';
import SimpleBar from 'simplebar-react';
import * as SpotifyWebApiExport from 'spotify-web-api-js';
import SongSelector from './SongSelector';

const SpotifyWebApi = SpotifyWebApiExport.default;

export default class PlaylistSelector extends React.Component {
  constructor(props) {
    super(props);

    // access tokens passed in as props, make call to get playlists here
    this.state = {
      playlistElems: [],
      finishedGrabbing: false,
      offset: 0,
      err: null,
      selectedId: null
    }

    this.getPlaylists = this.getPlaylists.bind(this);
    this.displaySongs = this.displaySongs.bind(this);
  }

  getPlaylists() {
    this.props.spotifyApi.getUserPlaylists({offset: this.state.offset, limit: 50}).then((data) => {
      let newPlaylistElems = data.items.map((playlist, i) => {
        let coverUrl = playlist.images.length > 0 ? playlist.images[0].url : '/public/assets/local-file.svg';
        let name = playlist.name;

        let coverElem = <img className="playlist-cover" src={coverUrl}/>
        let nameElem = <div className="playlist-name">{name}</div>
        let itemElem = <a key={`playlist-item-${i}`} onClick={this.displaySongs.bind(null, playlist.id, playlist.uri)} className="playlist-item">{coverElem}{nameElem}</a>

        return itemElem;
      });
      let newOffset = this.state.offset + data.items.length;

      this.setState({
        playlistElems: this.state.playlistElems.concat(newPlaylistElems),
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

  displaySongs(selectedId, playlistUri, event) {
    if (event.button === 0) {
      this.setState({
        ...this.state,
        selectedId,
        playlistUri
      });
    }
  }

  render() {
    if (this.state.err) {
      return (<p className="error">{`Error in retrieving playlists: ${this.state.err}`}</p>);
    } else if (this.state.selectedId) {
      return (<SongSelector spotifyApi={this.props.spotifyApi} playlistId={this.state.selectedId} playlistUri={this.state.playlistUri}/>);
    } else {
      if (!this.state.finishedGrabbing) {
        this.getPlaylists();
      }

      if (this.state.playlistElems.length === 0) {
        return (
        <div className="list-container pt-message">
          {this.state.finishedGrabbing ? 'No playlists' : 'Retrieving playlists'}
        </div>
        );
      } else {
        return (
        <SimpleBar className="list-container">
          {this.state.playlistElems}
        </SimpleBar>
        );
      }
    }
  }
}

PlaylistSelector.propTypes = {
  spotifyApi: PropTypes.instanceOf(SpotifyWebApi).isRequired,
}
