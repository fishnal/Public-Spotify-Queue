import PropTypes from 'prop-types';

export let Artist = PropTypes.shape({
  href: PropTypes.string.isRequired,
  uri: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
});

export let Image = PropTypes.shape({
  url: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
});

export let Album = PropTypes.shape({
  href: PropTypes.string.isRequired,
  uri: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  images: PropTypes.arrayOf(Image).isRequired
});

export let Track = PropTypes.shape({
  href: PropTypes.string.isRequired,
  uri: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  album: Album.isRequired,
  artists: PropTypes.arrayOf(Artist).isRequired
});

export let CurrentlyPlaying = PropTypes.shape({
  progress_ms: PropTypes.number.isRequired,
  is_playing: PropTypes.bool.isRequired,
  item: Track.isRequired
});
