import * as base_request from './base-request'

const DEFAULT_HOST: string = 'accounts.spotify.com';
const DEFAULT_PORT: number = 443;
const DEFAULT_SCHEME: string = 'https';

export function builder() {
	return base_request.builder()
		.withHost(DEFAULT_HOST)
		.withPort(DEFAULT_PORT)
		.withScheme(DEFAULT_SCHEME);
}