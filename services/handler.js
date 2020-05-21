const redisClient = require('../redisConnection.js');
const { roomCount, privateRoomCount } = require('./roomManager.js');
let num_of_users = 3;
var playerList = require('../data/players.json')


/**

    if roomCount < 8:
        addUser to the room channel
    else
        room is full and cannot be added
*/
PublicAddUser = async(io, roomId, socket, condition)=>{

  // The User is new to the Room . Add Him and increment the count
  let count = roomCount.get(roomId);
  if(condition === "new"){
        if(count < num_of_users){
            socket.join(roomId);
            //Set new RoomCount
            roomCount.set(roomId,count+1);
            socket.emit('success',`${roomId}`);

            //After adding the user if everyone is in the room , Start the match
            if(count+1 === num_of_users)
              startMatch(io, roomId, socket);

            return true;
        }
  }else if(condition === "present"){

      socket.join(roomId);
      socket.emit('success',`${roomId}`);
      return true;
  }

  socket.emit('failure','The Room is Full');
  return false;
}



PrivateAddUser = async(io, roomId, socket, condition )=>{


    let count = privateRoomCount.get(roomId);

    if(condition === "new"){
        if(count < num_of_users){
              socket.join(roomId);

              //set new roomCount
              privateRoomCount.set(roomId,count+1);
              socket.emit('success',`${roomId}`);

              //If everyone is there in the room start the match
              if(count+1 === num_of_users)
                startMatch(io, roomId, socket);

              return true;

        }else if(condition === "present"){

            socket.join(roomId);
            console.log(roomId);
            socket.emit('success',`${roomId}`);
            return true;

        }

        socket.emit('failure','This Room is Full');
        return false;

    }
}

//Sends a Timeout signal to the client asking his clock to start counting

startClockSignal = (io, roomId) =>{

   io.to(roomId).emit('Begin timeout','10s')

}

/** Once every player starts to become inactive the players state is noted and stored in the redisClient
    Using the playerName as the key and every other player detail is converted to a JSON string
    The JSON string can be stored in the redis   rommId_player: playername: "details"

    Change player index -> index+1

*/
closeCurrentPlayer = (io, roomId) =>{

  let playerName = io.nsps['/'].adapter.rooms[roomId].currentPlayer.player;
  let playerDetails = JSON.stringify(io.nsps['/'].adapter.rooms[roomId].currentPlayer)
  redisClient.hmset(`${roomId}_players`, playerName, playerDetails);
  io.nsps['/'].adapter.rooms[roomId].curr_index +=1;
  startNewBid(io, roomId)

}

/**
  Randomizes the Player List
  sets the index to 0 _---> Get the first player
*/

setPlayerList = (io,roomId) =>{
  var RandomList = [...playerList].sort(function(a,b){Math.random()-0.5})
  io.nsps['/'].adapter.rooms[roomId].playerList = [...RandomList]
  io.nsps['/'].adapter.rooms[roomId].curr_index = 0
}


/**

  Status = 0; Currently no Bid
  Status = 1 ; Currently a bid has been mad

*/

getPlayer = (io, roomId) =>{

  var Player = io.nsps['/'].adapter.rooms[roomId].playerList[io.nsps['/'].adapter.rooms[roomId].curr_index]
  Player.currentBid = 0
  Player.highestBidder = null
  Player.status = 0
  io.nsps['/'].adapter.rooms[roomId].currentPlayer = Player;

}

/**

  Called after closing on one player, changing to new Player

*/

startNewBid = (io , roomId) =>{

  getPlayer(io,roomId);
  io.to(roomName).emit('newPlayer',io.nsps['/'].adapter.rooms[roomId].currentPlayer);

}

/**

  Called after understanding the full capacity of the room
  Start match is Called

*/

startMatch = async(io,roomId, socket)=>{

    setPlayerList(io, roomId);
    getPlayer(io, roomId);

    await setTimeout(()=>{
        io.to(roomName).emit('newPlayer',io.nsps['/'].adapter.rooms[roomId].currentPlayer)
    },500)
}

newBid = (io,roomName, bid, email )=>{

    if(bid > io.nsps['/'].adapter.rooms[roomId].currentPlayer.currentBid && email !== io.nsps['/'].adapter.rooms[roomId].currentPlayer.highestBidder){
       io.nsps['/'].adapter.rooms[roomId].currentPlayer.currentBid = bid;
       io.nsps['/'].adapter.rooms[roomId].currentPlayer.status = 1;
       io.nsps['/'].adapter.rooms[roomId].currentPlayer.highestBidder = email;
    }
    io.to(roomName).emit('newBid', io.nsps['/'].adapter.rooms[roomId].currentPlayer);
}

module.exports = {
  PublicAddUser,
  PrivateAddUser,
  createRoom,
  closeCurrentPlayer,
  startClockSignal,
  newBid
};
