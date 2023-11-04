const express = require("express");
const app = express();
const mainLib = require('./lib/main')
const config = require('./config');
const mainInstance = mainLib.getInstance(app)
const mainApp = mainInstance.appGetter()
const httpServer = mainInstance.createServer()
const winston = require('winston-color');

const server = httpServer.listen(config.port, () => {
    winston.info('Server is running on port: %s', config.port);
});


