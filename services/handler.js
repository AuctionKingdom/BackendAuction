var rooms = []

var roomMap = new Map();

var Player = {
  player:'HarishK',
  currentBid:1,
  increment:0.5
}

//Handler for CreateRoom
createRoom = async(io, roomName, socket)=>{

      if(rooms.includes(roomName)){

          console.log(`Existing Room ${roomName} Called`);

          socket.emit('Error','Couldnt create the required Room as it already exists');

      }else{

          let newClient = [socket.id];

          console.log("Created");

          rooms.push(roomName);

          roomMap.set(roomName,newClient);

          socket.join(roomName);

          socket.emit('success',`${roomName}`);
      }


}

//Handler for JoinRoom
joinRoom = async(io, roomName, socket)=>{

    //Identifies whether the room exist
    if(rooms.includes(roomName)){

        //Gets the client List for the particular room
        let clientList = roomMap.get(roomName);
        clientList.push(socket.id);

        //Joining the socket to the broadcast of the room
        socket.join(roomName);

        socket.emit('success',`${roomName}`);

    }
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
