import * as React from 'react';
import PropTypes from 'prop-types';

export default class RecorderText extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<p className={this.props.err ? 'error' : ''}>{this.props.text}</p>);
  }
}

RecorderText.propTypes = {
  text: PropTypes.string.isRequired,
  err: PropTypes.instanceOf(Error)
};
