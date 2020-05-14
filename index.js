'use strict';

let express = require('express');
let app = express();
const port = process.env.PORT || 8080;
let io = require('socket.io')(app.listen(port,()=>console.log(`Listening on port ${port}`)));
const redis = require('./redisConnection.js');

require('./services/connection.js')(io);

module.exports =  app;
