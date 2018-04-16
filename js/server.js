const http = require('http');
const port = 8080;

function startServer(callback) {
	const server = http.createServer((req, resp) => {
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

module.exports = startServer;