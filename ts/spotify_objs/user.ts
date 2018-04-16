import { ExternalURL } from './external_url'
import { Followers } from './followers'

export interface UserPublic extends Object {
	display_name: string;
	external_urls: ExternalURL;
	followers: Followers;
	href: string;
	id: string;
	images: Image[];
	type: string;
	uri: string;
}

export interface UserPrivate extends UserPublic {
	display_name: string;
	email: string;
	product: string;
}