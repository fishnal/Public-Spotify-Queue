import * as React from 'react';
import PropTypes from 'prop-types';
import * as PSQProps from '../../props/psq';
import ArtistsDisplay from '../recorder/ArtistsDisplay';

/**
 * Header for the queue container.
 */
const queueHeader = (
  <div className="queue-item">
    <div className="queue-track">TRACK</div>
    <div className="queue-artist">ARTIST</div>
    <div className="queue-album">ALBUM</div>
  </div>
);

/**
 * Wraps the queue's items into div.queue-item elements.
 */
function wrap(items) {
  items.map((item, i) => {
    return (
      <div key={`queue-item${i}`} className="queue-item">
        <div className="queue-track">item.data.name</div>
        <div className="queue-artist"><ArtistsDisplay props={item.data.artists}/></div>
        <div className="queue-album">item.data.album.name</div>
      </div>
    )
  });
}

export default class Queue extends React.Component {
  constructor(props) {
    super(props);

    // Wrap the track items into div elements. Want to do this in the constructor because the
    // queue's state is not dependent on these items.
    let items = wrap(this.props.items);

    this.state = { items };
  }

  render() {
    return (
      <div data-simplebar className="queue-container">
        {queueHeader}
        {this.state.items}
      </div>
    );
  }
}

Queue.propTypes = {
  items: PropTypes.arrayOf(PSQProps.Track).isRequired
};
