'use strict';

const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config()
const bodyparser = require('body-parser');
const cookieparser = require('cookie-parser')
const expressvalidator = require('express-validator');
const cors = require('cors')
var redis = require('redis')

const PORT = 8080;
const HOST = '127.0.0.1';

// redis Database Connection

const client = redis.createClient({
  host : process.env.redishost,
  port : process.env.redisport,
  password : process.env.redispass
}).on('error', err => console.error("Error while creating connection to redis database", err));;


client.on('connect', function() {
  console.log("Connected to redis Database")
})


client.on('error', function() {
  console.log("Error connecting to redis Database")
})


//db

mongoose.connect(process.env.uri,{useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log('DB connected'))

mongoose.connection.on('error',err => {
  console.log(`DB connection error: ${err.message}`);
});

//bring in routes

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

app.get('/',(req,res)=>{
	res.send('Auction Kingdom');
});


app.use(morgan("dev"));
//app.use(myownmiddleware);

app.use(bodyparser.json())
app.use(cookieparser())
app.use(expressvalidator())
app.use(cors());
app.use("/",authRoutes);
app.use("/",userRoutes);
app.use(function (err,req,res,next){
  if(err.name === "UnauthorizedError") {
    res.status(401).json({error: "Unauthorized User!"});
  }
});

app.listen(PORT,HOST);
console.log(`Running on http://${HOST}:${PORT}`);




