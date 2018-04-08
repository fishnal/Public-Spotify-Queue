function Track(name, id, artists, albumName, albumImages, duration) {
    this.name = name;
	this.id = id;
	
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

function Playlist(name, id, ownerId, images) {
	this.name = name;
	this.id = id;
	this.ownerId = ownerId;
	this.images = images;
}

module.exports = {
	Track: Track,
	Playlist: Playlist
}