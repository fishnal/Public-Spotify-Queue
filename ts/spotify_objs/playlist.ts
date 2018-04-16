import { ExternalURL } from './external_url'
import { Image } from './image'
import { User } from './user'
import { Followers } from './followers'
import { Track } from './track'

export interface PlaylistSimple extends Object {
	collaborative: boolean;
	external_urls: ExternalURL;
	href: string;
	id: string;
	images: Image[];
	name: string;
	owner: User;
	public: boolean;
	snapshot_id: string;
	tracks: any; /* verify type */
	type: string;
	uri: string;
}

export interface Playlist extends PlaylistSimple {
	description: string;
	followers: Followers;
	tracks: any; /* verify type */
}

export interface PlaylistTrack extends Object {
	added_at: string;
	added_by: User;
	is_local: boolean;
	track: Track;
}