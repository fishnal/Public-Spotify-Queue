import PropTypes from 'prop-types';
import * as SpotifyProps from './spotify';

export let Tokens = PropTypes.shape({
  access: PropTypes.string,
  refresh: PropTypes.string,
  psq: PropTypes.string
});

export let Track = PropTypes.shape({
  data: PropTypes.instanceOf(SpotifyProps.Track).isRequired,
  psq_id: PropTypes.number.isRequired
});
