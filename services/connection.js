const { createRoom, joinRoom }  = require('./roomManager.js');
const { addUser } = require('./hander.js');
const { redisClient } = require('../index.js');

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
												io.to(results[1]).emit('people',objects)
											},500)
							})
					})

					socket.on('disconnect',()=>{
						console.log('client disconnected...',socket.id)
					})

		});
}

module.exports = connection;
