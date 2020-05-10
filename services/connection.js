module.exports = function(io){
		io.on('connection',(socket)=>{

					socket.emit('Connected',"True");
			    console.log("Got connection..",socket.id);

					socket.on('Create Room',data=>{
						console.log('Creating room');
						console.log(data.roomName);
						socket.join(data.roomName);
						io.to(data.roomName).emit('Information',`You have been added to the room ${data.roomName}`)
					})

					socket.on('Join Room',data=>{
						console.log('Joining Room');
						socket.join(data.roomName);
						io.to(data.roomName).emit('Information',`${data.user} has been added to the group`)
					})

					socket.on('disconnect',()=>{
						console.log('client disconnected...',socket.id)
					})

		});
}
