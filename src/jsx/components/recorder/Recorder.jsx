import * as React from 'react';
import PropTypes from 'prop-types';
import * as SpotifyWebApiExport from 'spotify-web-api-js';
import * as Cookies from 'js-cookie';
import { sprintf } from 'sprintf-js';
import * as axios from 'axios';
import RecorderText from './RecorderText';
import RecorderButton from './RecorderButton';

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
      text: 'Not recording right now.'
    };

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
        _this.props.refresh(this.state.tokens.psq_token).then(function(resp) {
          // TODO state here seems skeptical; this resolve callback should be called
          // after setState in the refresh function has completed
          spotifyApi.setAccessToken(this.state.tokens.access);
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
        text: 'Not recording right now'
      });

      return;
    }

    let _this = this;

    let resolveCB = function(playbackData) {
      let time = Math.max(playbackData['progress_ms'], 0);
      // get mins and secs from ms time
      let mins = parseInt(time / 60000);
      let secs = parseInt((time - mins * 60000) / 1000);
      let track = playbackData["item"];
      // parse track name and time elapsed
      let text = sprintf('%s - [%d:%02d]', track.name, mins, secs);

      _this.setState({
        ..._this.state,
        text
      });
    };

    let rejectCB = function(err) {
      // TODO properly handle errors here
      let text = null;

      if (err.isRefreshErr) {
        // error was produced from attempting to refresh our access token
        // TODO display status code and error description here
        text = `Couldn't refresh access token\n${err}`;
      } else {
        text = `Couldn't get playback information\n${err}`;
      }

      console.error(err);
      _this.setState({
        ..._this.state,
        text,
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
        text: 'Not recording right now'
      });
    } else {
      // start recording
      this.setState({
        ...this.state,
        isRecording: true,
        text: 'Connecting...'
      }, this.handlePlaybackInfo);
    }
  }

  render() {
    let { tokens, spotifyApi, isRecording, text } = this.state;

    spotifyApi.setAccessToken(tokens.access);

    return (
    <div>
      <p className="success">Application authenticated!</p>
      <RecorderButton onClick={this.onClick} isRecording={isRecording} />
      <RecorderText text={text} err={this.state.err} />
    </div>
    );
  }
}

Recorder.propTypes = {
  tokens: PropTypes.shape({
    access: PropTypes.string,
    refresh: PropTypes.string,
    psq: PropTypes.string
  }).isRequired,
  refresh: PropTypes.func.isRequired
};
