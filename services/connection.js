const { createRoom, joinRoom, availablePublicRoom}  = require('./roomManager.js');
const { addUser } = require('./handler.js');
const redisClient = require('../redisConnection.js');
const jwt = require('jsonwebtoken')
connection = (io)=>{

		io.on('connection',(socket)=>{

					socket.emit('Connected',"True");
			    console.log("Got connection..",socket.id);

					/**
						Create room doesnt expect the user to provide
						any roomName, while joining expects

						so need to create a small random link and make it available
					*/
					socket.on('Create Room',()=>{

							let results = createRoom(io,socket,addUser);

							if(results[0]){
										redisClient.hgetall(results[1],(err,object)=>{
												setTimeout(()=>{
													console.log(object);
													io.to(results[1]).emit('people',object)
												},500)
									 })

							}

					})


					socket.on('PlayOnline',data=>{

							let jwtToken = JSON.parse(data.token);
						  const decode = jwt.verify(jwtToken.token,process.env.jwt_secret)
							if(decode._id === jwtToken.user._id)
							{
									let result = availablePublicRoom(io,socket,addUser,jwtToken.user.email)
									if(result[0]){
											redisClient.hgetall(result[1],(err,object)=>{
												 setTimeout(()=>{
													 	console.log(object);
														io.to(result[1]).emit('people',object)
												 },500)
											})
									}

							}else{
									socket.emit('failure',"Invalid JWT Token")
							}
					})
					/**
						Joining the clicked roomId

					*/
					socket.on('Join Room',data=>{
							let roomId = data.roomId;
							console.log(roomId);
							if(joinRoom(io,socket,roomId,addUser)){
									clearInterval(this);
									redisClient.hgetall(roomId,(err,object)=>{
											setTimeout(()=>{
													console.log(object)
													io.to(roomId).emit('people',object)
											},500)
									})
							}
					})

					socket.on('disconnect',()=>{
						console.log('client disconnected...',socket.id)
					})

		});
}

module.exports = connection;
