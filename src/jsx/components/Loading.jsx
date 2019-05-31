import * as React from 'react';
import PropTypes from 'prop-types';

export default class Loading extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let loadText = `Loading${this.props.msg ? ` ${this.props.msg}` : ''}...`;
    return (<p>{loadText}</p>);
  }
}

Loading.propTypes = {
  msg: PropTypes.string
};
