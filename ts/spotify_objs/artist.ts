export interface ArtistSimple extends Object {
	external_urls: ExternalURL;
	href: string;
	id: string;
	name: string;
	type: string;
	uri: string;
}

export interface Artist extends ArtistSimple {
	followers: Followers;
	genres: string[];
	images: Image[];
	popularity: number;
}