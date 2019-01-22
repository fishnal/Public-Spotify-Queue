import * as React from 'react';
import PropTypes from 'prop-types';

export default class FailedAuth extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let errMsg = `Error in authorizing this application:\n${this.props.error}`;
    return (
      <p className="error">{errMsg}</p>
    );
  }
}

FailedAuth.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired
};
