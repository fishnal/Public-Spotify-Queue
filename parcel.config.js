const Bundler = require('parcel-bundler');
const path = require('path');
const commandArgs = require('commander');

commandArgs
  .option('-w|--watch', 'Whether to watch the build files')
  .parse(process.argv);

const entryFiles = path.join(__dirname, './src/jsx/index.jsx');

const options = {
  publicUrl: process.env.PUBLIC_URL || '/build',
  outDir: './build',
  outFile: 'bundle.js',
  minify: false,
  watch: commandArgs.watch || false
};

if (commandArgs.watch) {
  console.log('Watching parcel.config.js');
}

(async() => {
  const bundler = new Bundler(entryFiles, options);

  await bundler.bundle();
})();
