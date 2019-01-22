const gulp = require('gulp');
const mocha = require('gulp-mocha');
const sass = require('sass');
const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const util = require('util');
const glob = util.promisify(require('glob'));
const mkdirp = util.promisify(require('mkdirp'));
const remove = util.promisify(fs.remove);

const nodeTests = [
  `skiplist.test.js`,
  'mockserver.test.js',
  'server.test.js'
].map((testPath) => `${process.env.NODE_TEST_DIR}/${testPath}`);

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

gulp.task('test', testRunner.bind(null, nodeTests));

gulp.task('test:file', (done) => {
  let argIndex = process.argv.findIndex((arg) => arg === '-f' || arg === '--file');

  if (argIndex === -1 || argIndex === process.argv.length - 1) {
    done(new Error('No file specified'));
  } else {
    testRunner(process.argv[argIndex + 1], done);
  }
});

gulp.task('makeBuildDir', async(done) => {
  await mkdirp('./build');
  done();
});

gulp.task('clean', async(done) => {
  let files = await glob('**/@(#*#|*~)', {
    nodir: true,
    ignore: ['node_modules/**/*', '.cache/**/*', 'build/**/*']
  });

  files.forEach(async(f) => await remove(f));
  remove('./build');

  done();
});

gulp.task('sass', async(done) => {
  /** @type {sass.Options} */
  let opts = {
    includePaths: [ './src/styles' ],
    outputStyle: 'compressed',
    file: './src/styles/_main.scss',
    outFile: './build/main.css',
    sourceMap: './build/main.css.map',
    sourceComments: true
  };

  let publicUrl = process.env.PUBLIC_URL || '/build';
  let newMapUrl = `/*# sourceMappingURL=${publicUrl}/main.css.map */`;

  sass.render(opts, async(err, result) => {
    if (err) {
      console.log(err);
      done(err);
    } else {
      let { css: cssBuf, map: mapBuf } = result;

      {
        // fix source map url
        let mapUrlIndex = cssBuf.lastIndexOf('/*# sourceMappingURL=');
        let mapUrlLength = cssBuf.length - mapUrlIndex;
        let lengthDiff = newMapUrl.length - mapUrlLength;

        // if the new url length is more than current url length, then concat this buffer with another
        // buffer that accounts for the missing bytes
        // if it's less, then write to the original buffer, and slice off the bytes we don't need
        // if it's the same, just use the same buffer

        if (lengthDiff > 0) {
          // make a new buffer that has as many bytes as this difference
          cssBuf = Buffer.concat([cssBuf, Buffer.alloc(lengthDiff)]);
        } else {
          // slice off the portions we don't need
          cssBuf = cssBuf.slice(0, cssBuf.length - Math.abs(lengthDiff));
        }

        cssBuf.write(newMapUrl, mapUrlIndex);
      }

      {
        // change absolute paths to relative in map file
        let _pathRelative = (to) => path.relative('./build', to);
        let mapData = JSON.parse(mapBuf.toString());
        let absSources = mapData.sources;
        // convert absolute file URIs to file paths, then relativize them to the build directory
        let relSources = absSources.map(url.fileURLToPath).map(_pathRelative);

        mapData.sources = relSources;
        mapBuf = JSON.stringify(mapData);
      }

      await fs.writeFile(opts.outFile, cssBuf);
      await fs.writeFile(opts.sourceMap, mapBuf);

      done();
    }
  });
});

gulp.task('sass:watch', () => {
  gulp.watch('./src/styles/**/*.scss', gulp.series('sass', (done) => {
    done();
  }));
});
