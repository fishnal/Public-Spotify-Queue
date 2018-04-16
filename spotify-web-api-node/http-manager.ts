import * as superagent from 'superagent'
import { BaseRequest } from './base-request'
import { WebApiError } from './webapi-error'

export interface RequestOptions {
	query?: string;
	data?: string;
	headers?: string;
}

function _getParametersFromRequest(request: BaseRequest): RequestOptions {
	let options: RequestOptions = {};
	let reqHeaders = request.getHeaders();
	let reqBody = request.getBodyParameters();

	if (request.getQueryParameters()) {
		options.query = request.getQueryParameters();
	}

	if (reqHeaders) {
		if (reqHeaders['Content-Type'] == 'application/json') {
			options.data = JSON.stringify(reqBody);
		}

		options.headers = reqHeaders;
	} else if (reqBody) {
		options.data = reqBody;
	}

	return options;
};

function _getErrorObject(defaultMessage, err): WebApiError {
	let errorObject: WebApiError;

	if (typeof err.error === 'object' && typeof err.error.message == 'string') {
		// Web API Error format
		errorObject = new WebApiError(err.error.message, err.error.status);
	} else if (typeof err.error === 'string') {
		// Authorization Error format
		/* jshint ignore:start */
		errorObject = new WebApiError(err.error + ': ' + err['error_description']);
		/* jshint ignore:end */
	} else if (typeof err === 'string') {
		// Serialized JSON error
		try {
			var parsedError = JSON.parse(err);
			errorObject = new WebApiError(parsedError.error.message, parsedError.error.status);
		} catch (err) {
			// Error not JSON formatted
		}
	}
	
	if(!errorObject) {
		// Unexpected format
		errorObject = new WebApiError(defaultMessage + ': ' + JSON.stringify(err));
	}
	
	return errorObject;
}

/* TODO get types for `method` */
export class HttpManager {
	static _makeRequest(method, options: RequestOptions, uri: string, callback: Function) {
		let req = method(uri);

		if (options.query) {
			req.query(options.query);
		}

		if (options.data && (!options.headers || options.headers['Content-Type'] !== 'application/json')) {
			req.type('form');
			req.send(options.data);
		} else if (options.data) {
			req.send(options.data);
		}

		if (options.headers) {
			req.set(options.headers);
		}

		req.end((err, response) => {
			if (err) {
				let errorObject: WebApiError = _getErrorObject('Request error', {
					error: err
				});

				return callback(errorObject);
			} else {
				return callback(null, {
					body: response.body,
					headers: response.headers,
					statusCode: response.statusCode
				});
			}
		});
	}

	/**
	 * Make a HTTP GET request.
	 * @param {BaseRequest} request the request.
	 * @param {Function} callback the callback function.
	 */
	static get(request: BaseRequest, callback: Function): void {
		let options: RequestOptions = _getParametersFromRequest(request);
		let method = superagent.get;

		HttpManager._makeRequest(method, options, request.getURI(), callback);
	}

	/**
	 * Make a HTTP POST request.
	 * @param {BaseRequest} request the request.
	 * @param {Function} callback the callback function.
	 */
	static post(request: BaseRequest, callback: Function): void {
		let options: RequestOptions = _getParametersFromRequest(request);
		let method = superagent.post;
		
		HttpManager._makeRequest(method, options, request.getURI(), callback);
	}

	/**
	 * Make a HTTP DELETE request.
	 * @param {BaseRequest} request the request.
	 * @param {Function} callback the callback function.
	 */
	static del(request: BaseRequest, callback: Function): void {
		let options: RequestOptions = _getParametersFromRequest(request);
		let method = superagent.del;

		HttpManager._makeRequest(method, options, request.getURI(), callback);
	};
  
	/**
	 * Make a HTTP PUT request.
	 * @param {BaseRequest} request the request.
	 * @param {Function} callback the callback function.
	 */
	static put(request: BaseRequest, callback: Function): void {
		let options: RequestOptions = _getParametersFromRequest(request);
		let method = superagent.put;

		HttpManager._makeRequest(method, options, request.getURI(), callback);
	};
}