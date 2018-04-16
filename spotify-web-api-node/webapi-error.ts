export class WebApiError extends Error {
	constructor(message: string, statusCode?: number) {
		super(message);
		
		this.name = 'WebApiError';
		this.message = message || '';
		this.statusCode = statusCode;
	}

	statusCode: number;
}