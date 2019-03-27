import * as React from 'react';
import PropTypes from 'prop-types';

export default class TrackDisplay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="record-track">
      {
        this.props.is_local
          ? this.props.name || 'Local Track'
          : <a href={this.props.link}>{this.props.name}</a>
      }
      </div>
    )
  }
}

TrackDisplay.propTypes = {
  link: PropTypes.string,
  name: PropTypes.string,
  is_local: PropTypes.bool.isRequired
}
