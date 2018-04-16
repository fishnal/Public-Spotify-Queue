import * as base_request from './base-request'

const DEFAULT_HOST: string = 'api.spotify.com';
const DEFAULT_PORT: number = 443;
const DEFAULT_SCHEME: string = 'https';

export function builder(accessToken: string) {
	return base_request.builder()
		.withHost(DEFAULT_HOST)
		.withPort(DEFAULT_PORT)
		.withScheme(DEFAULT_SCHEME)
		.withAuth(accessToken);
}