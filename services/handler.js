const redisClient = require('../redisConnection.js');
const { roomCount, privateRoomCount, UserToPlayer} = require('./roomManager.js');
let num_of_users = 2;
var playerList = require('../data/players.json')


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

            //After adding the user if everyone is in the room , Start the match
            if(count+1 === num_of_users)
              startMatch(io, roomId, socket);

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

              //If everyone is there in the room start the match
              if(count+1 === num_of_users)
                startMatch(io, roomId, socket);

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

//Sends a Timeout signal to the client asking his clock to start counting

startClockSignal = (io, roomId) =>{

   io.to(roomId).emit('Begin timeout','10s')

}

/** Once every player starts to become inactive the players state is noted and stored in the redisClient
    Using the playerName as the key and every other player detail is converted to a JSON string
    The JSON string can be stored in the redis   rommId_player: playername: "details"

    Change player index -> index+1

*/
closeCurrentPlayer = (io, roomId) =>{

  let highestBidder = io.nsps['/'].adapter.rooms[roomId].currentPlayer.highestBidder;
  let playerName = io.nsps['/'].adapter.rooms[roomId].currentPlayer.player;
  let playerDetails = JSON.stringify(io.nsps['/'].adapter.rooms[roomId].currentPlayer)
  redisClient.hmset(`${roomId}_players`, playerName, playerDetails);

  console.log(io.nsps['/'].adapter.rooms[roomId].currentPlayer);
  let currentBid = io.nsps['/'].adapter.rooms[roomId].currentPlayer.currentBid;
  // Only if someone has offered a bid for the player execute this code.. Inorder to prevent null values
  if(io.nsps['/'].adapter.rooms[roomId].currentPlayer.status === 1){
        redisClient.hget(roomId, highestBidder, (err,object)=>{

            if(object){
                userDetails = JSON.parse(object)
                userDetails['wallet'] = userDetails['wallet']-currentBid;

              //Test Purpose
                console.log("Closing Player to User")
                console.log(userDetails)

                redisClient.hmset(roomId, highestBidder, JSON.stringify(userDetails))
            }
        })
        console.log(highestBidder)
        UserToPlayer[highestBidder][roomId] +=1
  }else{

      io.nsps['/'].adapter.rooms[roomId].UnSold = [...io.nsps['/'].adapter.rooms[roomId].UnSold,
                                                        io.nsps['/'].adapter.rooms[roomId].currentPlayer]

  }

  io.nsps['/'].adapter.rooms[roomId].curr_index +=1;
  startNewBid(io, roomId)

}


/**
  Shuffle Array
*/
shuffle = (array) => {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


/**
  Randomizes the Player List
  sets the index to 0 _---> Get the first player

  Initial bid Indication even before anyone makes a bid attempt
*/

setPlayerList = (io,roomId) =>{

  io.nsps['/'].adapter.rooms[roomId].playerList = shuffle(JSON.parse(JSON.stringify(playerList)));
  io.nsps['/'].adapter.rooms[roomId].curr_index = 0;
  io.nsps['/'].adapter.rooms[roomId].bidIndication = null;
  io.nsps['/'].adapter.rooms[roomId].bidDone = null;
  io.nsps['/'].adapter.rooms[roomId].UnSold = [];
  io.nsps['/'].adapter.rooms[roomId].UnSoldRequest = 0;
}


/**

  Status = 0; Currently no Bid
  Status = 1 ; Currently a bid has been mad

*/

getPlayer = (io, roomId) =>{

  var Player = io.nsps['/'].adapter.rooms[roomId].playerList[io.nsps['/'].adapter.rooms[roomId].curr_index]
  Player.currentBid = 0
  Player.highestBidder = null
  Player.status = 0
  io.nsps['/'].adapter.rooms[roomId].currentPlayer = {...Player};

}

/**
    For a new Player introduced to the bidding system, one time timeout feature is done
*/

beforeBidSignal = (io, roomId) =>{

  io.nsps['/'].adapter.rooms[roomId].bidIndication = setTimeout(()=>{
                                                          startClockSignal(io, roomId);
                                                    },20000)
  io.nsps['/'].adapter.rooms[roomId].bidDone = setTimeout(()=>{
                                                          closeCurrentPlayer(io, roomId);
                                                    },30000)
}

// Clears the one-time timer initialized at the beginning of the Player Bidding

clearBidSignal = async(io, roomId) =>{

  await clearTimeout(io.nsps['/'].adapter.rooms[roomId].bidIndication)
  await clearTimeout(io.nsps['/'].adapter.rooms[roomId].bidDone)

}

/**

  Called after closing on one player, changing to new Player

*/

startNewBid = (io , roomId) =>{

  getPlayer(io,roomId);
  io.to(roomId).emit('newPlayer',io.nsps['/'].adapter.rooms[roomId].currentPlayer);

  beforeBidSignal(io,roomId);

}

/**

  Called after understanding the full capacity of the room
  Start match is Called

*/

startMatch = async(io,roomId, socket)=>{

    setPlayerList(io, roomId);
    getPlayer(io, roomId);

    await setTimeout(()=>{
        io.to(roomId).emit('newPlayer',io.nsps['/'].adapter.rooms[roomId].currentPlayer)
    },500)

    beforeBidSignal(io,roomId);

}

// Clears the initial Timer and proceeds to set or reject the bid made by the user

newBid = (io,roomId, bid, email )=>{

    clearBidSignal(io, roomId)

    redisClient.hget(roomId, email, (err,object)=>{
        if(object){
            let Details = JSON.parse(object)
            /**
               Condition that whether he has enough fund to pull off a 11 memeber team or if already has 11 members
               Does he have enough fund for 11 members
            */

            if( (UserToPlayer[email][roomId] <= 11 && (Details.wallet- bid - (11-UserToPlayer[email][roomId])*20) > 0) ||
                (UserToPlayer[email][roomId] > 11 && (Details.wallet - bid)>=0)
              ){

                if(bid > io.nsps['/'].adapter.rooms[roomId].currentPlayer.currentBid && email !== io.nsps['/'].adapter.rooms[roomId].currentPlayer.highestBidder){
                    io.nsps['/'].adapter.rooms[roomId].currentPlayer.currentBid = parseInt(bid);
                    io.nsps['/'].adapter.rooms[roomId].currentPlayer.status = 1;
                    io.nsps['/'].adapter.rooms[roomId].currentPlayer.highestBidder = email;
                    console.log(io.nsps['/'].adapter.rooms[roomId].currentPlayer.currentBid)
                    io.to(roomId).emit('newBid', io.nsps['/'].adapter.rooms[roomId].currentPlayer);
                }
            }
    }
  })

}

module.exports = {
  PublicAddUser,
  PrivateAddUser,
  createRoom,
  closeCurrentPlayer,
  startClockSignal,
  startMatch,
  newBid
};
