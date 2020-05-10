'use strict';

let express = require('express');
let app = express();
let server = app.listen(8080);
let io = require('socket.io')(server);

require('./routes/connection.js')(io);

console.log(`Running on http://localhost:8080`);

module.exports = app;
