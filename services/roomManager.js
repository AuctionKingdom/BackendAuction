const redisClient = require('../redisConnection.js');
const crypto = require("crypto");
var roomCount = new Map();
var privateRoomCount = new Map();

createRoom = (io, socket, addUser, user, type) =>{

    //Created a random RoomName and attached the client name
    const id = crypto.randomBytes(5).toString("hex");
    redisClient.hmset(id,user.email,user.name);

    if(type === "public"){
        roomCount.set(id,0);
        return [addUser(io,id,socket,"new"),id];
    }else{
        privateRoomCount.set(id,0);
        return [addUser(io,id,socket,"new"),id];
    }

}

joinRoom = (io, socket, roomid, addUser, user) =>{

  /**  Difficult to add roomid thats random so a mapping for roomName, id
      should be maintained   */
    if(redisClient.exists(roomid)){
        if(privateRoomCount.get(roomid) < 3){
            redisClient.hget(roomid,user.email,function(err,object){
               if(object){
                  console.log(user);
                  console.log(object);
                  return [addUser(io,roomid,socket,"present"), roomid];
               }
            })
            redisClient.hmset(roomid,user.email,user.name);
            return [addUser(io,roomid,socket,"new"),roomid];
        }
    }else{
        return [false, roomid];
    }

}

/**

  Available Rooms

  Only add the Player to the public Room if he is not already in the room

*/

availablePublicRoom = (io, socket, addUser, user)=>{

  const obj = {};
  for (const key of roomCount.keys()) {
    if(roomCount.get(key) < 3){
      redisClient.hget(key,user.email,function(err,object){
          if(object){
             console.log(`Player already in the Room , So just Redirect`)
             return [addUser(io,key,socket,"present"),key]
          }
          if(err){
            console.log(`Public Room Error: ${err}`)
          }
      })
      redisClient.hmset(roomid,user.email,user.name);
      return [addUser(io,key,socket,"new"),key]
    }
  }

  return createRoom(io, socket, addUser, user, "public")

}

module.exports = {
  createRoom,
  privateRoomCount,
  joinRoom,
  availablePublicRoom,
  roomCount
}
