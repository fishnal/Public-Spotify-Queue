import { ArtistSimple } from './artist'
import { ExternalURL } from './external_url'
import { AlbumSimple } from './album'
import { ExternalID } from './external_id'


export interface TrackSimple extends Object {
	artists: ArtistSimple[];
	available_markets: string[];
	disc_number: number;
	duration_ms: number;
	explicit: boolean;
	external_urls: ExternalURL;
	href: string;
	id: string;
	is_playable: boolean;
	linked_from: TrackLink;
	name: string;
	preview_url: string;
	track_number: number;
	type: string;
	uri: string;
}

export interface Track extends TrackSimple {
	album: AlbumSimple;
	external_ids: ExternalID;
	restrictions: any; /* TODO verify type */
	popularity: number;
}

export interface TrackLink extends Object {
	external_urls: ExternalURL;
	href: string;
	id: string;
	type: string;
	uri: string;
}
