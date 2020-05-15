const { createRoom, joinRoom, availableRoom}  = require('./roomManager.js');
const { addUser } = require('./handler.js');
const redisClient = require('../redisConnection.js');

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

							if(results[0])
									redisClient.hgetall(results[1],(err,object)=>{
											setTimeout(()=>{
												console.log(object);
												io.to(results[1]).emit('people',object)
											},500)
							})
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
