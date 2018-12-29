const commandArgs = require('commander');
const fs = require('fs');
const path = require('path');
const util = require('util');

commandArgs.version('0.1.0', '-v|--version')
    .option('-c|--config <config file>', 'Configuration file that specifies any required and optional arguments. Overrides all other arguments')
    .option('-i|--id <client id>', 'Spotify Developer Application client ID', /^[a-zA-Z0-9]+$/)
    .option('-s|--secret <client secret>', 'Spotify Developer Application client secret', /^[a-zA-Z0-9]+$/)
    .option('-a|--address <server address>', 'Address that server is hosted on', 'http://localhost')
    .option('-p|--port [port number]', 'Port for the server', /^[0-9]+$/, 3000)
    .parse(process.argv);

(async() => {
    if (commandArgs.config) {
        // read in config file's contents
        let configContents = await util.promisify(fs.readFile)(path.resolve(commandArgs.config));
        // split into lines
        configContents = configContents.toString().split('\n');
        let new_options = { };
        let optionKeys = ['id', 'secret', 'address', 'port'];

        // parse the config lines
        configContents.forEach((line) => {
            let match = /(?<option>id|secret|address|port)=(?<value>.*)/.exec(line);

            if (match) {
                new_options[match.groups.option] = match.groups.value === '' ? null : match.groups.value;
            }
        });

        process.argv.splice(2);
        Object.keys(new_options).forEach((key) => {
            process.argv.push(`--${key}`);
            process.argv.push(new_options[key]);
        });
    }

    const server = require('./src/server.js');
    server.start();
})();
