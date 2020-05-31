const redisClient = require('../redisConnection.js');
const crypto = require("crypto");
var playerList = require('../data/players.json')

var roomCount = new Map();
var privateRoomCount = new Map();
var UserToPlayer = new Map();
var roomSizeMap = new Map();


initialUserSet = async(roomId, email) =>{

  let initialSet = {...UserToPlayer[email]}
  initialSet[roomId] = 0
  UserToPlayer[email] = {...initialSet}

}

emitPeople = async(io,roomid) =>{

  await redisClient.hgetall(roomid,(err,object)=>{
     setTimeout(()=>{
        console.log(object);
        io.to(roomid).emit('people',object)
     },5000)
   })

}


createRoom = async(io, socket, addUser, user, type, roomSize) =>{

    //Created a random RoomName and attached the client name
    const id = crypto.randomBytes(3).toString("hex");
    await redisClient.hmset(id,user.email,JSON.stringify({name:user.name, wallet:13000}));

    if(type === "public"){

        roomSizeMap.set(id,roomSize);
        roomCount.set(id,0);
        initialUserSet(id, user.email);

    }else{

        roomSizeMap.set(id,roomSize);
        privateRoomCount.set(id,0);
        initialUserSet(id,user.email);
    }

    await addUser(io,id,socket,"new",roomSizeMap.get(id));
    await emitPeople(io,id);

}


joinRoom = async(io, socket, roomid, addUser, user) =>{

  /**  Difficult to add roomid thats random so a mapping for roomName, id
      should be maintained   */
    if(redisClient.exists(roomid)){

            await redisClient.hget(roomid,user.email,function(err,object){

               if(object){

                 addUser(io,roomid,socket,"present",roomSizeMap.get(roomid));

               }else if(privateRoomCount.get(roomid) < roomSizeMap.get(roomid)){

                   initialUserSet(roomid, user.email);
                   redisClient.hmset(roomid,user.email,JSON.stringify({name:user.name, wallet:13000}));
                   addUser(io,roomid,socket,"new",roomSizeMap.get(roomid));

               }
               emitPeople(io,roomid);
            })
    }

}

/**

  Available Rooms

  Only add the Player to the public Room if he is not already in the room

*/

availablePublicRoom = async(io, socket, addUser, user)=>{

  const obj = {};
  for (const key of roomCount.keys()) {

    await redisClient.hget(key,user.email,function(err,object){
        if(object){

             addUser(io,key,socket,"present",roomSizeMap.get(key))

        }else if(roomCount.get(key) < roomSizeMap.get(key)){

            initialUserSet(key, user.email);
            redisClient.hmset(key,user.email,JSON.stringify({name:user.name, wallet:13000}));
            addUser(io,key,socket,"new", roomSizeMap.get(key))

        }
        if(err){
          console.log(`Public Room Error: ${err}`)
        }
        emitPeople(io,roomid);
      })
  }
  await createRoom(io, socket, addUser, user, "public", 8)

}

module.exports = {
  createRoom,
  privateRoomCount,
  joinRoom,
  availablePublicRoom,
  roomCount,
  UserToPlayer,
  emitPeople,
}
