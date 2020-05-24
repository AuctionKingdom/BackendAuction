const redisClient = require('../redisConnection.js');
const crypto = require("crypto");
var playerList = require('../data/players.json')

var roomCount = new Map();
var privateRoomCount = new Map();
var UserToPlayer = new Map();

createRoom = (io, socket, addUser, user, type) =>{

    //Created a random RoomName and attached the client name
    const id = crypto.randomBytes(5).toString("hex");
    redisClient.hmset(id,user.email,JSON.stringify({name:user.name, wallet:13000}));

    if(type === "public"){
        roomCount.set(id,0);
        let initialSet = {...UserToPlayer[user.email]}
        initialSet[id] = 0
        UserToPlayer[user.email] = {...initialSet}
        return [addUser(io,id,socket,"new"),id];
    }else{
        privateRoomCount.set(id,0);
        let initialSet = {...UserToPlayer[user.email]}
        initialSet[id] = 0
        UserToPlayer[user.email] = {...initialSet}
        return [addUser(io,id,socket,"new"),id];
    }

}

joinRoom = (io, socket, roomid, addUser, user) =>{

  /**  Difficult to add roomid thats random so a mapping for roomName, id
      should be maintained   */
    if(redisClient.exists(roomid)){
        if(privateRoomCount.get(roomid) < 2){
            redisClient.hget(roomid,user.email,function(err,object){
               if(object){

                  return [addUser(io,roomid,socket,"present"), roomid];
               }
            })
            let initialSet = {...UserToPlayer[user.email]}
            initialSet[roomid] = 0
            UserToPlayer[user.email] = {...initialSet}
            redisClient.hmset(roomid,user.email,JSON.stringify({name:user.name, wallet:13000}));
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
    if(roomCount.get(key) < 2){
      redisClient.hget(key,user.email,function(err,object){
          if(object){
             console.log(`Player already in the Room , So just Redirect`)
             return [addUser(io,key,socket,"present"),key]
          }
          if(err){
            console.log(`Public Room Error: ${err}`)
          }
      })
      let initialSet = {...UserToPlayer[user.email]}
      initialSet[key] = 0
      UserToPlayer[user.email] = {...initialSet}
      redisClient.hmset(key,user.email,JSON.stringify({name:user.name, wallet:13000}));
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
  roomCount,
  UserToPlayer,
}
