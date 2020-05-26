const redisClient = require('../redisConnection.js');
const crypto = require("crypto");
var playerList = require('../data/players.json')

var roomCount = new Map();
var privateRoomCount = new Map();
var UserToPlayer = new Map();

initialUserSet = (roomId, email) =>{

  let initialSet = {...UserToPlayer[email]}
  initialSet[roomId] = 0
  UserToPlayer[email] = {...initialSet}

}

createRoom = (io, socket, addUser, user, type) =>{

    //Created a random RoomName and attached the client name
    const id = crypto.randomBytes(5).toString("hex");
    redisClient.hmset(id,user.email,JSON.stringify({name:user.name, wallet:13000}));

    if(type === "public"){
        roomCount.set(id,0);
        initialUserSet(id, user.email)

        return [addUser(io,id,socket,"new"),id];
    }else{
        privateRoomCount.set(id,0);
        initialUserSet(id,user.email);

        return [addUser(io,id,socket,"new"),id];
    }

}

joinRoom = (io, socket, roomid, addUser, user) =>{

  /**  Difficult to add roomid thats random so a mapping for roomName, id
      should be maintained   */
    if(redisClient.exists(roomid)){
        console.log('Room Exists....')
            redisClient.hget(roomid,user.email,function(err,object){
               if(object){
                  return [addUser(io,roomid,socket,"present"), roomid];
               }
            })
            if(privateRoomCount.get(roomid) < 2){

                initialUserSet(roomid, user.email)
                redisClient.hmset(roomid,user.email,JSON.stringify({name:user.name, wallet:13000}));
                return [addUser(io,roomid,socket,"new"),roomid];

            }else{
                return [false, roomid];
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

      redisClient.hget(key,user.email,function(err,object){
        if(object){

             console.log(`Player already in the Room , So just Redirect`)
             return [addUser(io,key,socket,"present"),key]

        }else if(roomCount.get(key) < 2){

            initialUserSet(key, user.email)
            redisClient.hmset(key,user.email,JSON.stringify({name:user.name, wallet:13000}));
            return [addUser(io,key,socket,"new"),key]

        }
        if(err){
          console.log(`Public Room Error: ${err}`)
        }
      })
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
