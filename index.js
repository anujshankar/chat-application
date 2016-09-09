// Include all the modules required
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var redis = require('redis');
var redisClient = redis.createClient(); //creates a new client

// Initialize appication with route / (that means root of the application)
app.get('/', function(req, res){
  var express=require('express');
  app.use(express.static(path.join(__dirname)));
  res.sendFile(path.join(__dirname, '../chat-application', 'index.html'));
});
 
var messages = [];
function storeMessage(from,msg){
	var message = JSON.stringify({name:from, data: msg});
	redisClient.lpush("messages",message,function(err,response){
		redisClient.ltrim("messages",0,9); // keeps newest 10 items
	});
}

// Register events on socket connection
io.on('connection', function(socket){ 
  socket.on('newConnect', function(user){  
    console.log("New Connection is made!");
    redisClient.lrange("messages",0,-1,function(err,messages){
		messages = messages.reverse(); // so that they are emitted in correct order
		messages.forEach(function(message){
			message = JSON.parse(message);
			io.emit('join',message.name,message.data);
		});
	});
	io.emit('chatMessage', 'System', '<b>' + user + '</b> has joined the discussion');
  });
  socket.on('chatMessage', function(from, msg){
    io.emit('chatMessage', from, msg);
    storeMessage(from,msg);
  }); 
  socket.on('notifyUser', function(user){
    io.emit('notifyUser', user);
  });
});
 
// Listen application request on port 3000
http.listen(3000, function(){
  console.log('listening on *:3000');
});
