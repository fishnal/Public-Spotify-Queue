// var trackItems = require ('./sample_tracks_in.json')

function Track (trackName, trackId, artists, albumName, albumImages, duration) {
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

function Playlist (playlistName, playlistId, playlistImages) {
	this.playlistName = playlistName;
	this.playlistId = this.playlistId;
	this.playlistImages = this.playlistImages;
}

// var trackList =[];

// for(let i = 0; i < trackItems.items.length; i++){
// 	let track = trackItems.items[i].track;
// 	trackList.push(new Track (
// 		track.name, 
// 		track.id, 
// 		track.artists, 
// 		track.album.name,
// 		track.album.images,
// 		track.duration_ms)
// 	)

// }

// console.log(trackList);

module.exports = {
	Track: Track,
	Playlist: Playlist
}