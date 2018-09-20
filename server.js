"use strict";
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http, {
  pingInterval: 2500,
  pingTimeout: 500
});
const util = require('util');
const SHOT_DELAY = 250;
const PORT = 8080;
const WIDTH = 1920;
const HEIGHT = 800;
const BUSH_SIZE = 200;
const MINE_DELAY = 10000;

app.use('/',function(req, res, next){
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
   console.log("[" + ip + "] " + req.originalUrl);
   next();
});
app.use('/', express.static(__dirname + '/public'));


http.listen(PORT, function() {
  console.log('Server avviato sulla porta ' + PORT);
});



function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

var bushes = [];

var Bush = class Bush {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.image = "img/bush.png";
    this.size = BUSH_SIZE;
  }
};

for(var i = 0; i < getRandom(0,2); i++)
{
  bushes.push(new Bush(Math.round(getRandom(BUSH_SIZE,WIDTH - BUSH_SIZE)), Math.round(getRandom(BUSH_SIZE,HEIGHT - BUSH_SIZE))));
}

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
var zombiescount = 0;
var playerscount = 0;
var mines = [];
io.on('connection', function(socket) {
  var player = '';
  var last_shot = 0;
  var spawned = false;
  var type = "";
  var minescount = 3;
  console.log('[Info] Nuovo utente collegato ' + socket.id);

  socket.emit('playerscount', {players:playerscount,zombies:zombiescount});
  socket.emit('bushes', bushes);
  socket.on('new', function(data) {
    if(existPlayer(socket.id))
    {
      console.log("[Info] Giocatore duplicato, lo disconnetto!");
      //socket.disconnect(true);
    }
    else {
      type = data.IMAGE.replace("img/","").replace(".png","");
      player = new Player(socket.id, data.X, data.Y, data.DIRECTION, data.IMAGE, type);
      addPlayer(player);
      socket.emit('new', getPlayers());
      socket.broadcast.emit('update', player);
      spawned = true;
      if(type == "player")
        playerscount++;
      else
        zombiescount++;
      console.log('[Info] Nuovo giocatore caricato!');
      io.sockets.emit('log', {message:'[Info] Nuovo giocatore caricato ' + socket.id + "! (Zombies " + zombiescount + ", Players " + playerscount +")"});
      socket.emit('mines', mines);
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

  socket.on('exploded', function(data) {
    var id = data.id;
    for(var i = 0; i < mines.length; i++)
    {
      var m = mines[i];
      if(m.ID == id)
      {
        var index = mines.indexOf(m);
        if (index > -1) {
          mines.splice(index, 1);
        }
        io.sockets.emit('exploded', {id:m.ID, name: data.name});
      }
    }
  });

  socket.on('newmine', function(data) {
    if(minescount <= 0)
      return;

    if(data.OWNER == socket.id)
    {
      minescount--;
      setTimeout(function(){
        minescount += 1;
        socket.emit('minescount', {count:minescount});
      },MINE_DELAY);
    }
    console.log("[Info] Nuova mina di " + data.OWNER + " rimaste: " + minescount);
    io.sockets.emit('newmine', data);
    mines.push(data);
  });

  socket.on('disconnect', function(reason) {
    if(!spawned)
    {
      reconnect(socket);
      return;
    }
    console.log('[Info] Utente disconnesso ' + socket.id);
    io.sockets.emit('log', {message:'[Info] Utente disconnesso ' + socket.id});
    socket.broadcast.emit('quit', player);
    removePlayer(player);
    if(type == "player")
      playerscount--;
    else
      zombiescount--;
  });

  socket.on('newbullet', function(data){
    if(!spawned)
    {
      reconnect(socket);
    }
    var current = new Date().getTime();
    if(current - last_shot >= SHOT_DELAY)
    {
      last_shot = current;
      console.log('[Info] Nuovo sparo da parte di ' + socket.id + '!');
      io.sockets.emit('bullet', data);
    }
  });
});
