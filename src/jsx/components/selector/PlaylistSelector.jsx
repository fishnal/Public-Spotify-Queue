import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as PSQProps from '../../props/psq';
import SimpleBar from 'simplebar-react';
import * as SpotifyWebApiExport from 'spotify-web-api-js';
import Loading from '../Loading';

const SpotifyWebApi = SpotifyWebApiExport.default;

export default class PlaylistSelector extends React.Component {
  constructor(props) {
    super(props);

    // access tokens passed in as props, make call to get playlists here
    this.state = {
      playlists: null,
      finishedGrabbing: false,
      offset: 0,
      err: null
    }

    this.getPlaylists = this.getPlaylists.bind(this);
  }

  getPlaylists() {
    let currentPlaylists = this.state.playlists || [];

    this.props.spotifyApi.getUserPlaylists({offset: this.state.offset, limit: 50}).then((data) => {
      let newOffset = this.state.offset + data.items.length;
      this.setState({
        playlists: currentPlaylists.concat(data.items),
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
      return (<p className="error">{`Error in retrieving playlists: ${this.state.err}`}</p>);
    } if (!this.state.finishedGrabbing) {
      this.getPlaylists();
      return (<Loading msg="playlists" />);
    } else {
      let playlistElems = this.state.playlists.map((playlist,i) => {
        let coverUrl = playlist.images.length > 0 ? playlist.images[0].url : '/public/assets/local-file.svg';
        let name = playlist.name;
        let url = playlist.uri;

        let coverElem = <img className="playlist-cover" src={coverUrl}/>
        let nameElem = <div className="playlist-name">{name}</div>
        let itemElem = <a key={`playlist-item${i}`} href={url} className="playlist-item">{coverElem}{nameElem}</a>

        return itemElem;
      });

      return (
      <SimpleBar className="playlist-container">
        {playlistElems}
      </SimpleBar>
      );
    }
  }
}

PlaylistSelector.propTypes = {
  spotifyApi: PropTypes.instanceOf(SpotifyWebApi).isRequired,
}
