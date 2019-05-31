import * as React from 'react';
import PropTypes from 'prop-types';

export default class FailedRefresh extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let msg = `Couldn't refresh access (code ${this.props.status_code})\n` +
      `Error ${this.props.error_description}`;
    return (<p className="error">{msg}</p>);
  }
}

/* FailedRefresh.propTypes = {
  status_code: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  error_description: PropTypes.string.isRequired
}; */
