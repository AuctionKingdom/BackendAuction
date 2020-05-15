const redisClient = require('../redisConnection.js');
const crypto = require("crypto");
var roomCount = new Map();

createRoom = (io, socket, addUser, email) =>{

    //Created a random RoomName and attached the client name
    const id = crypto.randomBytes(5).toString("hex");
    redisClient.hmset(id,socket.id,email);
    roomCount.set(id,1);

    return [addUser(io,id,socket),id];

}

joinRoom = (io, socket, roomid, addUser) =>{

  /**  Difficult to add roomid thats random so a mapping for roomName, id
      should be maintained   */
    if(redisClient.exists(roomid)){

        if(addUser(io,roomid,socket)){

              redisClient.hmset(roomid,socket.id,"dummy");
              let count = roomCount.get(roomid);
              roomCount.set(roomid,count+1);
              return true;
        }

    }
    return false;
}

/**

  Available Rooms

*/

availablePublicRoom = (io, socket, addUser, email)=>{

  const obj = {};
  for (const key of roomCount.keys()) {
    if(roomCount.get(key) < 3)
      return [addUser(io,key,socket),key]
  }

  return createRoom(io, socket, addUser, email)

}

module.exports = {
  createRoom,
  joinRoom,
  availablePublicRoom,
  roomCount
}
