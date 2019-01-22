import * as React from 'react';
import PropTypes from 'prop-types';

export default class RecorderButton extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let btnText = `${this.props.isRecording ? 'Stop' : 'Start'} recording`;
    return (<button onClick={this.props.onClick}>{btnText}</button>);
  }
}

RecorderButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isRecording: PropTypes.bool.isRequired
};
