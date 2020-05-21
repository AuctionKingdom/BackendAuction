const { createRoom, joinRoom, availablePublicRoom }  = require('./roomManager.js');
const { PublicAddUser, PrivateAddUser, startMatch, startClockSignal, closeCurrentPlayer, } = require('./handler.js');
const redisClient = require('../redisConnection.js');
const jwt = require('jsonwebtoken')

connection = (io)=>{

		var BidIndication, BidDone;

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
								let results = createRoom(io,socket,PrivateAddUser,user,"private");
						  	if(results[0]){
											redisClient.hgetall(results[1],(err,object)=>{
													setTimeout(()=>{
														console.log(object);
														io.to(results[1]).emit('people',object)
													},500)
							 			})
								}
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
									let result = availablePublicRoom(io,socket,PublicAddUser,user)
									if(result[0]){
											redisClient.hgetall(result[1],(err,object)=>{
												 setTimeout(()=>{
													 	console.log(object);
														io.to(result[1]).emit('people',object)
												 },500)
											})
									}
									startMatch(io,result[1],socket);
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
								let result = joinRoom(io,socket,roomId,PrivateAddUser,user)
								console.log(user);
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
					 Link add is called when the user joins directly using  a Link
					 */

					 socket.on('Link Join', data=>{

						 	let jwtToken = JSON.parse(data.token);
							let roomId = data.roomId;
							const decode = jwt.verify(jwtToken.token, process.env.jwt_secret)
							if(decode._id === jwtToken.user._id)
							{
								 let user = {'email':jwtToken.user.email, 'name':jwtToken.user.name};
								 let result = joinRoom(io, socket, roomId, PrivateAddUser, user)
								 if(result[0]){
										redisClient.hgetall(result[1],(err,object)=>{
												setTimeout(()=>{
														console.log(object);
														io.to(result[1]).emit('people',object)
												},500)
										})
								 }
							}else{
									socket.emit('failure','Invalid JWT Token');
							}
					 })



					/**
						Once one of the user bids, the Timeout to send clock signal is reset
						data : token roomId currentBid

					*/
					socket.on('Bid', (data) =>{

							clearTimeout(BidDone)
							clearTimeout(BidIndication)


							BidIndication = setTimeout((data)=>{
									startClockSignal(data.roomId);
							},10000)

							BidDone = setTimeout((data)=>{
									closeCurrentPlayer(data.roomId);
							},20000)



					})


					socket.on('disconnect',()=>{

						console.log('client disconnected...',socket.id)
					})

		});
}

module.exports = connection;
