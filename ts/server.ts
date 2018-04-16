import * as http from 'http';
const port: number = 8080;

export function startServer(callback: (url?: string) => void) {
	const server: http.Server = http.createServer((req, resp) => {
		resp.end('You can now close this window.', () => {
			console.log('Closing server');
			server.close();
			req.destroy();
	
			/* resume other calls */
			callback(req.url);
		});
	});
	
	server.listen(port, err => {
		if (err) {
			throw err;
		} else {
			console.log(`Local server listening on port ${port}`);
		}
	});
}
