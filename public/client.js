const DEBUG = false;
if (!DEBUG) {
  console.log = function() {};
}

const SOCKET = io();
const IMAGE = 'img/player.png';
let GAME = '';
const GAME_X = 500;
const GAME_Y = 500;
const PLAYER_HEIGHT = 100;
const PLAYER_WIDTH = 100;
const SPEED = 10;
var NAME = '';
var players = [];
var player = '';
var direction = 'FORWARD';
var moved = true;

document.addEventListener('DOMContentLoaded', function(event) {
  GAME = document.getElementById('game');
});

function spawnPlayer() {
  NAME = SOCKET.id;
  player = document.createElement('img');
  player.src = IMAGE;
  player.alt = NAME;
  player.width = PLAYER_WIDTH;
  player.height = PLAYER_HEIGHT;
  player.style.left = getRandomNumber(0, GAME_X - PLAYER_WIDTH) + 'px';
  player.style.top = getRandomNumber(0, GAME_Y - PLAYER_HEIGHT) + 'px';
  var position = {
    X: Number(player.style.left.replace('px', '')),
    Y: Number(player.style.top.replace('px', '')),
    DIRECTION: direction
  };
  GAME.appendChild(player);
  SOCKET.emit('new', position);
}

function createPlayer(name, x, y) {
  var newplayer = document.createElement('img');
  newplayer.src = IMAGE;
  newplayer.alt = name;
  newplayer.width = PLAYER_WIDTH;
  newplayer.height = PLAYER_HEIGHT;
  newplayer.style.left = x + 'px';
  newplayer.style.top = y + 'px';
  GAME.appendChild(newplayer);
  return newplayer;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function move(event) {
  if (!moved) {
    return;
  }
  var key = event.code;
  var position = {
    X: Number(player.style.left.replace('px', '')),
    Y: Number(player.style.top.replace('px', '')),
    DIRECTION: direction
  };
  if (key == 'KeyW') {
    position.Y -= SPEED;
    direction = 'FORWARD';
  } else if (key == 'KeyA') {
    position.X -= SPEED;
    direction = 'LEFT';
  } else if (key == 'KeyS') {
    position.Y += SPEED;
    direction = 'BACK';
  } else if (key == 'KeyD') {
    position.X += SPEED;
    direction = 'RIGHT';
  }

  if (position.X < 0) {
    position.X = 0;
  } else if (position.X > GAME_X - PLAYER_WIDTH) {
    position.X = GAME_X - PLAYER_WIDTH;
  } else if (position.Y < 0) {
    position.Y = 0;
  } else if (position.Y > GAME_Y - PLAYER_HEIGHT) {
    position.Y = GAME_Y  - PLAYER_HEIGHT;
  }
  player.style.top = Number(position.Y) + 'px';
  player.style.left = Number(position.X) + 'px';
  console.log('Mando la mia posizione');
  SOCKET.emit('move', position);
}

SOCKET.on('new', function(data) {
  console.log('Carico i giocatori');
  for (var i = 0; i < data.length; i++) {
    var p = '';
    if (data[i].name != NAME) {
      p = createPlayer(data[i].name, data[i].x, data[i].y);
    } else {
      p = player;
    }
    players.push({element: p, name: data[i].name, x: data[i].x, y: data[i].y, direction: data[i].direction});
  }
});

SOCKET.on('update', function(data) {
  console.log('Nuovo giocatore connesso');
  var p = createPlayer(data.name, data.x, data.y);
  players.push({element: p, name: data.name, x: data.x, y: data.y, direction: data.direction});
});

SOCKET.on('move', function(data) {
  moved = true;
  console.log('Aggiorno le posizioni');
  for (var a = 0; a < data.length; a++) {
    for (var i = 0; i < players.length; i++) {
      if (data[a].name == NAME) {
        players[i].x = data[a].x;
        players[i].y = data[a].y;
        players[i].direction = data[a].direction;
        continue;
      }
      if (data[a].name == players[i].name) {
        players[i].element.style.top = Number(data[a].y) + 'px';
        players[i].element.style.left = Number(data[a].x) + 'px';
        players[i].x = data[a].x;
        players[i].y = data[a].y;
        players[i].direction = data[a].direction;
        break;
      }
    }
  }
});

SOCKET.on('quit', function(data) {
  console.log('Un utente si è disconnesso');
  for (var i = 0; i < players.length; i++) {
    if (players[i].name == data.name) {
      players[i].element.remove();
      removeArray(players[i], players);
      break;
    }
  }
});

SOCKET.on('disconnect', function(){
  document.write("Connessione con il server persa!");
});

function removeArray(name, array) {
  var index = array.indexOf(name);
  if (index > -1) {
    array.splice(index, 1);
  }
}
