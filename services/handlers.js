module.exports = function(socket){

  const client = socket;

  function handleJoin(){
    const createEntry = ()=>({event:`joined ${client.id}`})
      client.emit('message','Fuck off');
  }

  return{
    handleJoin
  }
}
