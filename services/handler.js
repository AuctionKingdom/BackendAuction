const redisClient = require('../redisConnection.js');
const { roomCount, privateRoomCount } = require('./roomManager.js');
let num_of_users = 3;
var Player = {
  player:'HarishK',
  currentBid:1,
  increment:0.5
}

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


startMatch = (io,roomName, socket)=>{

    io.to(roomName).emit('newPlayer',Player)
}

newBid = (io,roomName,bid,socket)=>{

    console.log(`Current Bid for ${Player.player} by ${socket.id} at ${bid}`);
    Player.currentBid = bid;
    console.log(Player)
    io.to(roomName).emit('newBid',Player);

}

module.exports = {
  PublicAddUser,
  PrivateAddUser,
  createRoom,
  startMatch,
  newBid
};
