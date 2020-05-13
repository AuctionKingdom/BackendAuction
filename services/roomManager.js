const redisClient = require('../redisConnection.js');
const crypto = require("crypto");
var roomCount = new Map();

createRoom = (io, socket, addUser) =>{

    //Created a random RoomName and attached the client name
    const id = crypto.randomBytes(5).toString("hex");
    redisClient.hmset(id,socket.id,"dummy");
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

availableRoom = ()=>{

  const obj = {};
  for (const key of roomCount.keys()) {
    obj[key] = roomCount.get(key);
  }
  return obj;
}

module.exports = {
  createRoom,
  joinRoom,
  availableRoom,
  roomCount
}
