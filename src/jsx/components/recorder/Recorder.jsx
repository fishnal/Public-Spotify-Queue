import * as React from 'react';
import PropTypes from 'prop-types';
import * as SpotifyWebApiExport from 'spotify-web-api-js';
import * as Cookies from 'js-cookie';
import TrackDisplay from './TrackDisplay';
import RecorderButton from './RecorderButton';
import * as PSQProps from '../../props/psq';

// approx interval time to get current playing track
const playbackIntervalTime = 1000;
// couldn't import the default export, so doing it here manually
const SpotifyWebApi = SpotifyWebApiExport.default;

export default class Recorder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tokens: this.props.tokens,
      spotifyApi: new SpotifyWebApi(),
      isRecording: false,
      displayData: 'Not recording right now'
    };

    this.state.spotifyApi.setAccessToken(this.state.tokens.access);
    this.getCurrentTrack = this.getCurrentTrack.bind(this);
    this.handlePlaybackInfo = this.handlePlaybackInfo.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  // gets the current playing track
  getCurrentTrack() {
    let { spotifyApi } = this.state;
    let _this = this;

    return new Promise(function(resolve, reject) {
      if (!Cookies.get('access_token')) {
        _this.props.refresh(_this.state.tokens.psq_token).then(function(resp) {
          // TODO state here seems skeptical; this resolve callback should be called
          // after setState in the refresh function has completed
          spotifyApi.setAccessToken(_this.state.tokens.access);
          _this.getCurrentTrack().then(resolve).catch(reject);
        }).catch(function(err) {
          err.isRefreshErr = true;
          reject(err);
        });
      } else {
        spotifyApi.getMyCurrentPlayingTrack().then(resolve).catch(resolve);
      }
    });
  }

  handlePlaybackInfo() {
    if (!this.state.isRecording) {
      this.setState({
        ...this.state,
        displayData: 'Not recording right now'
      });

      return;
    }

    let _this = this;

    let resolveCB = function(playbackData) {
      _this.setState({
        ..._this.state,
        displayData: playbackData
      });
    };

    let rejectCB = function(err) {
      // TODO properly handle errors here
      let displayData = null;

      if (err.isRefreshErr) {
        // error was produced from attempting to refresh our access token
        // TODO display status code and error description here
        displayData = `Couldn't refresh access token\n${err}`;
      } else {
        displayData = `Couldn't get playback information\n${err}`;
      }

      console.error(err);
      _this.setState({
        ..._this.state,
        displayData,
        err
      });
    };

    let finallyCB = function() {
      setTimeout(_this.handlePlaybackInfo, playbackIntervalTime);
    };

    this.getCurrentTrack()
      .then(resolveCB)
      .catch(rejectCB)
      .finally(finallyCB);
  }

  onClick(event) {
    if (event.button !== 0) {
      return;
    }

    if (this.state.isRecording) {
      // stop recording
      this.setState({
        ...this.state,
        isRecording: false,
        displayData: 'Not recording right now'
      });
    } else {
      // start recording
      this.setState({
        ...this.state,
        isRecording: true,
        displayData: 'Connecting...'
      }, this.handlePlaybackInfo);
    }
  }

  render() {
    let { isRecording, displayData } = this.state;

    return (
    <div>
      <p className="success">Application authenticated!</p>
      <RecorderButton onClick={this.onClick} isRecording={isRecording} />
      <TrackDisplay displayData={displayData} err={this.state.err} />
    </div>
    );
  }
}

Recorder.propTypes = {
  tokens: PSQProps.Tokens.isRequired,
  refresh: PropTypes.func.isRequired
};
