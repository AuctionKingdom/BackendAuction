const { createRoom, joinRoom, availablePublicRoom }  = require('./roomManager.js');
const { PublicAddUser, PrivateAddUser, startClockSignal, closeCurrentPlayer, newBid} = require('./handler.js');
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
					socket.on('Create Room',(data)=>{

						let jwtToken = JSON.parse(data.token);
						const decode = jwt.verify(jwtToken.token,process.env.jwt_secret)
						if(decode._id === jwtToken.user._id)
						{
								let user = {'email':jwtToken.user.email,'name':jwtToken.user.name}
						    createRoom(io,socket,PrivateAddUser,user,"private");

					  }else{
								socket.emit('failure','Invalid JWT Token')
						}
				})


					socket.on('PlayOnline',data=>{

							let jwtToken = JSON.parse(data.token);
						  const decode = jwt.verify(jwtToken.token,process.env.jwt_secret)
							if(decode._id === jwtToken.user._id)
							{
									let user = {'email':jwtToken.user.email,'name':jwtToken.user.name}
									availablePublicRoom(io,socket,PublicAddUser,user)
							}else{
									socket.emit('failure',"Invalid JWT Token")
							}
					})
					/**
						Joining the clicked roomId

					*/
					socket.on('Join Room',data=>{


						let jwtToken = JSON.parse(data.token);
						let roomId = data.roomId;
						const decode = jwt.verify(jwtToken.token,process.env.jwt_secret)
						if(decode._id === jwtToken.user._id)
						{
								let user = {'email':jwtToken.user.email,'name':jwtToken.user.name}
								joinRoom(io,socket,roomId,PrivateAddUser,user)
						}else{
								socket.emit('failure',"Invalid JWT Token")
						}
					})


					/**
					 	Link add is called when the user joins directly using  a Link
					*/

					 socket.on('Link Join', data=>{

						 	let jwtToken = JSON.parse(data.token);
							let roomId = data.roomId;
							console.log(roomId)
							const decode = jwt.verify(jwtToken.token, process.env.jwt_secret)
							if(decode._id === jwtToken.user._id)
							{
								 let user = {'email':jwtToken.user.email, 'name':jwtToken.user.name};
								 joinRoom(io, socket, roomId, PrivateAddUser, user)

							}else{
									socket.emit('failure','Invalid JWT Token');
							}
					 })



					/**
						Once one of the user bids, the Timeout to send clock signal is reset
						data : token roomId currentBid

					*/
					socket.on('Bid', data =>{

							newBid(io, data.roomId, data.bid, data.email);

					})

					socket.on('leave',data=>{
							try{
								socket.leave(data.roomId)
							}catch(error){
								console.log('No Room exists now')
							}
					})


					socket.on('disconnect',()=>{

						console.log('client disconnected...',socket.id)
					})

		});
}

module.exports = connection;
