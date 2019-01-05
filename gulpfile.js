const gulp = require('gulp');
const mocha = require('gulp-mocha');
const util = require('util');
const mkdirp = util.promisify(require('mkdirp'));

const backendTests = [
    './test/js/backend/skiplist.test.js',
    './test/js/backend/mockserver.test.js',
    './test/js/backend/server.test.js'
]

function testRunner(testFiles, done) {
    process.env = {
        ...process.env,
        ...{
            TEST_SERVER: 'http://localhost',
            TEST_PORT: '5000',
            TEST: 'true',
            CLIENT_ID: 'id',
            CLIENT_SECRET: 'secret'
        }
    };

    gulp.src(testFiles, {read: false})
    .pipe(mocha({
        reporter: 'mochawesome',
        reporterOptions: {
            reportDir: "docs/mocha-report"
        }
    }))
    .once('end', () => { process.exit(1) })
    .on('error', () => { console.error(err); });

    done();
}

gulp.task('test', testRunner.bind(null, backendTests));

gulp.task('test:file', (done) => {
    let argIndex = process.argv.findIndex((arg) => arg === '-f' || arg === '--file');

    if (argIndex === -1 || argIndex === process.argv.length - 1) {
        done(new Error('No file specified'));
    } else {
        testRunner(process.argv[argIndex + 1], done);
    }
});

gulp.task('makeBuildDir', async(done) => {
    await mkdirp('./build/static/js');
    await mkdirp('./build/test');
    done();
});
