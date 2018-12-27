const cp = require('child_process');
const path = require('path');

let args = process.argv.slice(2);

let file = args[0];
file = path.resolve(file);
if (!file) {
    console.error("file wasn't specified");
    process.exit(1);
}

let useMocha = args[1] || 'false';

if (useMocha !== 'false' && useMocha !== 'true') {
    console.error('invalid useMocha value')
    process.exit(1);
}

let cmd = 'node --inspect-brk ';

if (useMocha === 'true') {
    cmd += './node_modules/mocha/bin/mocha ';
}

cmd += `"${file}"`;

let subproc = cp.exec(cmd);

subproc.on('error', (err) => {
    throw err;
});

subproc.stdout.pipe(process.stdout);
subproc.stderr.pipe(process.stderr);
