const { redisClient } from '../index.js';
const { roomCount } from './roomManager.js';
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
addUser = async(io, roomId, socket)=>{

    if(roomCount.get(roomId) < num_of_users){
        socket.join(roomId)
        io.to(roomId).emit('success','redirect');
        return true;
    }

    return false;
}


startMatch = async(io,roomName, socket)=>{

    io.to(roomName).emit('newPlayer',Player)
}

newBid = async(io,roomName,bid,socket)=>{

    console.log(`Current Bid for ${Player.player} by ${socket.id} at ${bid}`);
    Player.currentBid = bid;
    console.log(Player)
    io.to(roomName).emit('newBid',Player);

}

module.exports = {
  joinRoom,
  createRoom,
  startMatch,
  newBid
};
