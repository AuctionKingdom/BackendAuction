'use strict';

let express = require('express');
const cors = require('cors')
let app = express();
const port = process.env.PORT || 8080;

app.use(cors())

let io = require('socket.io')(app.listen(port,()=>console.log(`Listening on port ${port}`)));


const redis = require('./redisConnection.js');

//Other Requirements
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config()
const bodyparser = require('body-parser');
const cookieparser = require('cookie-parser')
const expressvalidator = require('express-validator');


require('./services/connection.js')(io);


//Connection to mongodb
mongoose.connect(process.env.uri,{useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => console.log('DB connected'))


mongoose.connection.on('error',err => {
  console.log(`DB connection error: ${err.message}`);
});

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");


//Login routes

app.get('/',(req,res)=>{
	res.send('Auction Kingdom');
});

//Cookie parser to parse cookies
app.use(morgan("dev"));
app.use(bodyparser.json())
app.use(expressvalidator())
app.use(cookieparser())


//Route to the required routes
app.use("/",authRoutes);
app.use("/",userRoutes);



module.exports =  app;
