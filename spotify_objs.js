function Track(trackName, trackId, artists, albumName, albumImages, duration) {
    this.trackName = trackName;
	this.trackId = trackId;
	
	/* comma separating artists into one string */
	this.artists = '';
    for(let i = 0; i < artists.length; i++){  
		if (i != 0) {
			this.artists += ', ';
		}

        this.artists += artists[i].name
	}
	
	this.albumName = albumName;
	this.albumImages = albumImages;
	this.duration = duration;
}

function Playlist(playlistName, playlistId, playlistImages) {
	this.playlistName = playlistName;
	this.playlistId = this.playlistId;
	this.playlistImages = this.playlistImages;
}

module.exports = {
	Track: Track,
	Playlist: Playlist
}