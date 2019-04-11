import * as React from 'react';
import PropTypes from 'prop-types';
import * as Cookies from 'js-cookie';
import * as SpotifyWebApiExport from 'spotify-web-api-js';
import RecordDisplay from './RecordDisplay';
import RecorderButton from './RecorderButton';
import AsyncController from './../../async_controller';

const SpotifyWebApi = SpotifyWebApiExport.default;

// approx interval time to get current playing track
const playbackIntervalTime = 1000;

export default class Recorder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isRecording: false,
      displayData: 'Not recording right now'
    };

    this.getCurrentTrack = this.getCurrentTrack.bind(this);
    this.handlePlaybackInfo = this.handlePlaybackInfo.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  // gets the current playing track
  getCurrentTrack() {
    let spotifyApi = this.props.spotifyApi;

    return this.props.asyncController.enqueue(spotifyApi.getMyCurrentPlayingTrack, spotifyApi);
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
    <div className="recorder-container">
      <RecorderButton onClick={this.onClick} isRecording={isRecording} />
      <RecordDisplay displayData={displayData} err={this.state.err} />
    </div>
    );
  }
}

Recorder.propTypes = {
  spotifyApi: PropTypes.instanceOf(SpotifyWebApi).isRequired,
  asyncController: PropTypes.instanceOf(AsyncController).isRequired
};
