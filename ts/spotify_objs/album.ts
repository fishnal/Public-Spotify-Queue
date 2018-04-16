export interface AlbumSimple extends Object {
	album_group?: string;
	album_type: string;
	artists: Artists[];
	available_markets: string[];
	external_urls: ExternalURL;
	href: string;
	id: string;
	images: Image[];
	name: string;
	type: string;
	release_date: string;
	release_date_precision: string;
	uri: string;
}

export interface Album extends AlbumSimple {
	copyrights: Copyright[];
	external_ids: ExternalID;
	genres: string[];
	label: string;
	popularity: integer;
	tracks: TrackSimple[];	
}