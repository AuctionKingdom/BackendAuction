const makeHandlers = require('./handlers');

module.exports = function(io){
		io.on('connection',(socket)=>{

					const {

						handleJoin

					} = makeHandlers(socket);

			    console.log("Got connection..",socket.id);
	    		socket.on('join',handleJoin)
					socket.on('disconnect',()=>{
						console.log('client disconnected...',socket.id)
						socket.emit('disconnect',"Successfully disconnected")
					})

					socket.on('error',(err)=>{
							console.log('Received error from client:',client.id)
							console.log(err);
					})
		});
}
