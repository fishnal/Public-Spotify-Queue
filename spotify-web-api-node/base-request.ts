export class BaseRequest {
	constructor(builder: Builder) {
		if (!builder) {
			throw new Error('No builder supplied to constructor');
		}

		/* TODO find out types of builder's properties */
		this.host = builder['host'];
		this.port = builder['port'];
		this.scheme = builder['scheme'];
		this.queryParameters = builder['queryParameters'];
		this.bodyParameters = builder['bodyParameters'];
		this.headers = builder['headers'];
		this.path = builder['path'];
	}

	/* TODO find out types of these properties */
	host: any;
	port: any;
	scheme: any;
	queryParameters: any;
	bodyParameters: any;
	headers: any;
	path: any;

	/* TODO could also do _getter = (key: string): () => any => () => this[key]; */
	_getter(key: string): () => any {
		return () => this[key];
	}

	getHost: () => any = this._getter('host');
	getPort: () => any = this._getter('port');
	getScheme: () => any = this._getter('scheme');
	getPath: () => any = this._getter('path');
	getQueryParameters: () => any = this._getter('queryParameters');
	getBodyParameters: () => any = this._getter('bodyParameters');
	getHeaders: () => any = this._getter('headers');

	getURI(): string {
		if (!this.scheme || !this.host || !this.port) {
			throw new Error('Missing components necessary to construct URI');
		}
		
		let uri: string = this.scheme + '://' + this.host;

		if (this.scheme === 'http' && this.port !== 80 ||
			this.scheme === 'https' && this.port !== 443) {
			uri += ':' + this.port;
		}

		if (this.path) {
			uri += this.path;
		}

		return uri;
	}

	getURL(): string {
		let uri: string = this.getURI();
		let queryString: string = this.getQueryParameterString();

		return queryString ? uri + queryString : uri;
	}

	getQueryParameterString(): string {
		let queryParams: any = this.getQueryParameters();

		if (queryParams) {
			return '?' + Object.keys(queryParams)
				.filter(key => queryParams[key] !== undefined)
				.map(key => key + '=' + queryParams[key])
				.join('&');
		} else {
			return null;
		}
	}

	execute(method: Function, callback: Function): Promise<any> {
		if (callback) {
			method(this, callback);
			return;
		}

		let _self: BaseRequest = this;

		return new Promise((resolve, reject) => {
			method(_self, (error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
		});
	}
}

class Builder {
	_setter(key: string): (value: any) => Builder {
		return (value: any): Builder => {
			this[key] = value;
			return this;
		}
	}

	_assigner(key: string): (...args: any[]) => Builder {
		return (...args: any[]): Builder => {
			for (let i = 0; i < arguments.length; i++) {
				this[key] = Builder.prototype._assign(this[key], arguments[i]);
			}

			return this;
		}
	}

	/* TODO figure out what types of src and obj are */
	_assign(src, obj): any {
		if (obj != null && Object.keys(obj).length > 0) {
			return Object.assign(src || {}, obj);
		}

		return src;
	}

	build(): BaseRequest {
		return new BaseRequest(this);
	}

	withHost: (value: any) => Builder = this._setter('host');
	withPort: (value: any) => Builder = this._setter('port');
	withScheme: (value: any) => Builder = this._setter('scheme');
	withPath: (value: any) => Builder = this._setter('path');

	withQueryParameters: (...args: any[]) => Builder = this._assigner('queryParameters');
	withBodyParameters: (...args: any[]) => Builder = this._assigner('bodyParameters');
	withHeaders: (...args: any[]) => Builder = this._assigner('headers');

	withAuth(accessToken: string): Builder {
		if (accessToken) {
			this.withHeaders(
				{ 'Authorization' : 'Bearer' + accessToken }
			);
		}

		return this;
	};
};

export function builder(): Builder {
	return new Builder();
}