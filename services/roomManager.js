const { redisClient } = require('../index.js');
const crypto = require("crypto");
var roomCount = new Map();

createRoom = (io, socket, addUser) =>{

    //Created a random RoomName and attached the client name
    const id = crypto.randomBytes(16).toString("hex");
    redisClient.hmset(id,socket.id);
    roomCount.set(id,1);

    return [addUser(io,id,socket),id];

}

joinRoom = (io, socket, roomid, addUser) =>{

  /**  Difficult to add roomid thats random so a mapping for roomName, id
      should be maintained   */
    if(redisClient.exists(roomid)){

        if(addUser(io,roomid,socket)){

              redisClient.hmset(roomid, socket.id);
              let count = roomCount.get(id);
              roomCount.set(id,count+1);
              return true;
        }

    }
    return false;
}

module.exports = {
  createRoom,
  joinRoom,
  roomCount
}
