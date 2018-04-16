export class Track {
	name: string;
	id;
	uri: string;
	artists: string[];
	albumName: string;
	albumImages;
	duration;

	constructor(name: string, id, uri: string, artists: string[], albumName: string, albumImages, duration) {
		this.name = name;
		this.id = id;
		this.uri = uri;
		this.artists = artists;		
		this.albumName = albumName;
		this.albumImages = albumImages;
		this.duration = duration;
	}
}

export class Playlist {
	name: string;
	id;
	ownerId;
	images;

	constructor(name: string, id, ownerId, images) {
		this.name = name;
		this.id = id;
		this.ownerId = ownerId;
		this.images = images;
	}
}