require("babel-polyfill");
const commandArgs = require('commander');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readline = require('readline');

commandArgs.version('0.1.0', '-v|--version')
  // eslint-disable-next-line max-len
  .option('-c|--config <config file>', 'Configuration file that specifies any required and optional arguments')
  .option('-i|--clientId <client id>', 'Spotify Developer Application client ID', /^[a-zA-Z0-9]+$/)
  .option('-s|--clientSecret <client secret>', 'Spotify Developer Application client secret', /^[a-zA-Z0-9]+$/)
  .option('-d|--domain [server domain]', 'Domain of the server (default: http://localhost)')
  .option('-p|--port [port number]', 'Port for the server (default: 3000)', /^[0-9]+$/)
  .parse(process.argv);

(async() => {
  // args priority: command line -> config file -> environment variables

  // fallback on config file if present
  if (commandArgs.config) {
    // read in config file's contents
    let configContents = await util.promisify(fs.readFile)(path.resolve(commandArgs.config));
    // split into lines
    configContents = configContents.toString().split('\n');

    // parse the config lines
    configContents.forEach((line) => {
      let match = /(?<option>clientId|clientSecret|domain|port)=(?<value>.*)/.exec(line);

      if (match) {
        // we have a match, extract captured groups
        let { option, value } = match.groups;

        // only include this config file option if it's not already defined
        if (!commandArgs[option]) {
          commandArgs[option] = value === '' ? null : value;
        }
      }
    });
  }

  // fallback on environment variables
  {
    // maps environment variables to respective command line argument variables
    let envOptions = {
      CLIENT_ID: 'clientId',
      CLIENT_SECRET: 'clientSecret',
      DOMAIN: 'domain',
      PORT: 'port'
    };

    Object.keys(envOptions).forEach((envOpt) => {
      let equivalentCmdOpt = envOptions[envOpt];

      if (!commandArgs[equivalentCmdOpt]) {
        // since there's no config file or command line defined value for this option,
        // fallback onto this option's enviroment value
        commandArgs[equivalentCmdOpt] = process.env[envOpt];
      }
    });
  }

  if (!commandArgs.domain.startsWith('http://')) {
    commandArgs.domain = `http://${commandArgs.domain}`;
  }

  // eslint-disable-next-line global-require
  const server = require('./server.js');

  try {
    await server.start(commandArgs);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on('close', async() => {
      console.log('Stopping program');
      await server.close();
    });

    rl.on('line', (cmd) => {
      if (cmd === 'stop') {
        rl.close();
      } else {
        console.log(`Unknown command ${cmd}`);
      }
    });
  } catch (err) {
    console.error(err.name);
    console.error(err.message);
    console.error(err.stack);

    await server.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
