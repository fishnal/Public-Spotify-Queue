import * as React from 'react';
import PropTypes from 'prop-types';
import { getServerURL } from './../utils';

export default class Authorizer extends React.Component {
  constructor(props) {
    super(props);

    this.authorize = this.authorize.bind(this);
  }

  authorize(event) {
    let {CLIENT_ID, SCOPES, state} = this.props;

    if (event.button !== 0) {
      return;
    }

    let authURL = 'https://accounts.spotify.com/authorize' +
      `?client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${getServerURL()}` +
      `&state=${state}` +
      `&scope=${SCOPES.join('%20')}` +
      '&show_dialog=true';

    // go to auth path
    window.location.href = authURL;
  }

  render() {
    return (<button onClick={this.authorize}>Authorize</button>);
  }
}

Authorizer.propTypes = {
  CLIENT_ID: PropTypes.string.isRequired,
  SCOPES: PropTypes.arrayOf(PropTypes.string).isRequired,
  state: PropTypes.string.isRequired
};
