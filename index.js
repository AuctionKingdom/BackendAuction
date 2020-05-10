'use strict';

let express = require('express');
let app = express();
const port = process.env.PORT || 8080;
let server = require('http').createServer(app);
let io = require('socket.io')(server);

require('./services/connection.js')(io);

console.log(`Running on http://localhost:8080`);

server.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
