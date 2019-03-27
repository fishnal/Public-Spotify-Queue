import * as React from 'react';
import PropTypes from 'prop-types';

export default class AlbumDisplay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="record-album">
      {
        this.props.is_local
          ? this.props.name || 'Local Album'
          : <a href={this.props.link}>{this.props.name}</a>
      }
      </div>
    )
  }
}

AlbumDisplay.propTypes = {
  link: PropTypes.string,
  name: PropTypes.string,
  is_local: PropTypes.bool.isRequired
}
