import * as React from 'react';
import PropTypes from 'prop-types';

export default class CoverDisplay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let coverUrl = this.props.is_local ? '/public/assets/local-file.svg' : this.props.covers[0].url;
    let imgElem = <img className="record-cover" src={coverUrl} />;
    return (
      this.props.is_local
        ? imgElem
        : <a href={this.props.link}>{imgElem}</a>
    )
  }
}

CoverDisplay.propTypes = {
  covers: PropTypes.array.isRequired,
  link: PropTypes.string,
  is_local: PropTypes.bool.isRequired
}
