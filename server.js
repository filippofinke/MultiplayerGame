var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const util = require('util');

app.use("/", express.static(__dirname));

http.listen(80, function() {
  console.log('Server avviato sulla porta 80!');
});

var players = [];

var Player = class Player {
  constructor(name, x, y) {
    this.x = x;
    this.y = y;
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
  socket.on('new', function(data) {
    console.log('[Info] Nuovo giocatore creato!');
    player = new Player(socket.id, data.X, data.Y);
    addPlayer(player);
    socket.emit('new', getPlayers());
    socket.broadcast.emit('update', player);
  });

  socket.on('move', function(data) {
    player.x = data.X;
    player.y = data.Y;
    io.sockets.emit('move', getPlayers());
  });

  socket.on('disconnect', function(reason) {
    console.log('[Info] Utente disconnesso ' + socket.id);
    socket.broadcast.emit('quit', player);
    removePlayer(player);
  });
});
