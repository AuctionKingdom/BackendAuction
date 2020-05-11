const {joinRoom, createRoom} = require('./handler.js')

connection = (io)=>{
		io.on('connection',(socket)=>{

					socket.emit('Connected',"True");
			    console.log("Got connection..",socket.id);

					socket.on('Create Room',data=>{
							createRoom(io,data.roomName,socket);
					})

					socket.on('Join Room',data=>{
							joinRoom(io,data.roomName,socket);
					})

					socket.on('Start',data=>{
							startMatch(io,data,socket);
					})

					socket.on('increaseBid',data=>{
							newBid(io,data.roomName,data.bid,socket);
					})

					socket.on('disconnect',()=>{
						console.log('client disconnected...',socket.id)
					})

		});
}

module.exports = connection;
