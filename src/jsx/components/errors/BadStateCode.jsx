import * as React from 'react';
import { getServerURL } from '../../utils.js';

function retry(event) {
  if (event.button === 0) {
    window.location.replace(getServerURL());
  }
}

export default class BadStateCode extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
    <div>
      <p className="error">Bad State</p>
      <button onClick={retry}>Retry</button>
    </div>
    )
  }
}

BadStateCode.propTypes = { };
