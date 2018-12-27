const cp = require('child_process');
const path = require('path');

let file = process.argv.slice(2)[0];
file = path.resolve(file);

if (!file) {
	console.error("file wasn't specified");
	process.exit(1);
}

let cmd = `node --inspect-brk "${file}"`;

let subproc = cp.exec(cmd);

subproc.on('error', (err) => {
	throw err;
});

subproc.stdout.pipe(process.stdout);
subproc.stderr.pipe(process.stderr);
