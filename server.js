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
  constructor(name, x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.name = name;
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

io.on('connection', function(socket) {
  var player = '';
  console.log('[Info] Nuovo utente collegato ' + socket.id);
  io.sockets.emit('log', {message:'[Info] Nuovo utente collegato ' + socket.id + "!"});

  socket.on('new', function(data) {
    console.log('[Info] Nuovo giocatore creato!');
    io.sockets.emit('log', {message:'[Info] Nuovo giocatore creato ' + socket.id + "!"});

    player = new Player(socket.id, data.X, data.Y, data.DIRECTION);
    addPlayer(player);
    socket.emit('new', getPlayers());
    socket.broadcast.emit('update', player);
  });

  socket.on('move', function(data) {
    player.x = data.X;
    player.y = data.Y;
    player.direction = data.DIRECTION;
    io.sockets.emit('move', getPlayers());
  });

  socket.on('disconnect', function(reason) {
    console.log('[Info] Utente disconnesso ' + socket.id);
    io.sockets.emit('log', {message:'[Info] Utente disconnesso ' + socket.id});
    socket.broadcast.emit('quit', player);
    removePlayer(player);
  });
});
