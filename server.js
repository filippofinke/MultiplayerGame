var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const util = require('util');

app.use('/', express.static(__dirname + '/public'));

http.listen(80, function() {
  console.log('Server avviato sulla porta 80!');
});

var players = [];

var Player = class Player {
  constructor(name, x, y, direction, image, type) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.name = name;
    this.image = image;
    this.type = type;
  }
};

function removePlayer(name) {
  var index = players.indexOf(name);
  if (index > -1) {
    players.splice(index, 1);
  }
}

function addPlayer(name) {
  players.push(name);
}

function getPlayers() {
  return players;
}

function existPlayer(name)
{
  for(var i = 0; i < players.length; i++)
  {
    if(players[i].name == name)
    {
      return true;
    }
  }
  return false;
}

function reconnect(socket)
{
  console.log("[Errore] Utente già collegato ma non spawnato, faccio ricollegare!");
  socket.emit('reconnect',{message:"Errore, ricollegarsi!"});
  socket.disconnect(true);
}

io.on('connection', function(socket) {
  var player = '';
  var last_shot = 0;
  var spawned = false;
  console.log('[Info] Nuovo utente collegato ' + socket.id);
  io.sockets.emit('log', {message:'[Info] Nuovo utente collegato ' + socket.id + "!"});

  socket.on('new', function(data) {
    if(existPlayer(socket.id))
    {
      console.log("[Info] Giocatore duplicato, lo disconnetto!");
      socket.disconnect(true);
    }
    else {
      player = new Player(socket.id, data.X, data.Y, data.DIRECTION, data.IMAGE, data.IMAGE.replace("img/","").replace(".png",""));
      console.log('[Info] Nuovo giocatore creato!');
      io.sockets.emit('log', {message:'[Info] Nuovo giocatore creato ' + socket.id + "!"});
      addPlayer(player);
      socket.emit('new', getPlayers());
      socket.broadcast.emit('update', player);
      spawned = true;
    }
  });

  socket.on('move', function(data) {
    if(!spawned)
    {
      reconnect(socket);
    }
    player.x = data.X;
    player.y = data.Y;
    player.direction = data.DIRECTION;
    io.sockets.emit('move', getPlayers());
  });

  socket.on('disconnect', function(reason) {
    if(!spawned)
    {
      reconnect(socket);
    }
    console.log('[Info] Utente disconnesso ' + socket.id);
    io.sockets.emit('log', {message:'[Info] Utente disconnesso ' + socket.id});
    socket.broadcast.emit('quit', player);
    removePlayer(player);
  });

  socket.on('newbullet', function(data){
    if(!spawned)
    {
      reconnect(socket);
    }
    var current = new Date().getTime();
    if(current - last_shot >= 250)
    {
      last_shot = current;
      console.log('[Info] Nuovo sparo da parte di ' + socket.id + '!');
      io.sockets.emit('bullet', data);
    }
  });
});
