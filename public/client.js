const DEBUG = false;
if(!DEBUG)
{
  console.log = function(){};
}

const IMAGES = ['player.png','zombie.png'];
const SOCKET = io();
const IMAGE = 'img/' + IMAGES[getRandomNumber(0,IMAGES.length)];
let GAME = '';
const GAME_X = 500;
const GAME_Y = 500;
const PLAYER_HEIGHT = 75;
const PLAYER_WIDTH = 75;
const SPEED = 5;
var NAME = '';
var players = [];
var player = '';
var direction = 'FORWARD';
var lastKey = '';
setInterval(move, 20);
document.addEventListener('DOMContentLoaded', function(event) {
  GAME = document.getElementById('game');
});

function spawnPlayer() {
  NAME = SOCKET.id;
  player = document.createElement('img');
  player.src = getImage(IMAGE, direction);
  player.alt = NAME;
  player.width = PLAYER_WIDTH;
  player.height = PLAYER_HEIGHT;
  player.style.left = getRandomNumber(0, GAME_X - PLAYER_WIDTH) + 'px';
  player.style.top = getRandomNumber(0, GAME_Y - PLAYER_HEIGHT) + 'px';
  var position = {
    X: Number(player.style.left.replace('px', '')),
    Y: Number(player.style.top.replace('px', '')),
    DIRECTION: direction,
    IMAGE: IMAGE
  };
  GAME.appendChild(player);
  SOCKET.emit('new', position);
}

function createPlayer(name, x, y, img, dir) {
  var newplayer = document.createElement('img');
  newplayer.src = getImage(img, dir);
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

function move() {
  var key = lastKey;
  var position = {
    X: Number(player.style.left.replace('px', '')),
    Y: Number(player.style.top.replace('px', '')),
    DIRECTION: direction
  };

  switch (key) {

    case 'KeyW':
    position.Y -= SPEED;
    direction = 'FORWARD';
    break;

    case 'KeyA':
    position.X -= SPEED;
    direction = 'LEFT';
    break;

    case 'KeyS':
    position.Y += SPEED;
    direction = 'BACK';
    break;

    case 'KeyD':
    position.X += SPEED;
    direction = 'RIGHT';
    break;

    default:
    return;

  }

  if (position.X < 20) {
    position.X = 20;
  } else if (position.X > GAME_X - PLAYER_WIDTH) {
    position.X = GAME_X - PLAYER_WIDTH;
  } else if (position.Y < 20) {
    position.Y = 20;
  } else if (position.Y > GAME_Y - PLAYER_HEIGHT) {
    position.Y = GAME_Y  - PLAYER_HEIGHT;
  }

  player.style.top = '' + position.Y + 'px';
  player.style.left = '' + position.X + 'px';
  player.src = getImage(IMAGE, direction);

  console.log('Mando la mia posizione');
  SOCKET.emit('move', position);
}

SOCKET.on('new', function(data) {
  console.log('Carico i giocatori');
  for (var i = 0; i < data.length; i++) {
    var p = '';
    if (data[i].name != NAME) {
      p = createPlayer(data[i].name, data[i].x, data[i].y,data[i].image, data[i].direction);
    } else {
      p = player;
    }
    players.push({element: p, name: data[i].name, x: data[i].x, y: data[i].y, direction: data[i].direction, image: data[i].image});
  }
});

SOCKET.on('update', function(data) {
  console.log('Nuovo giocatore connesso');
  var p = createPlayer(data.name, data.x, data.y,data.image, data.direction);
  players.push({element: p, name: data.name, x: data.x, y: data.y, direction: data.direction, image: data.image});
});

SOCKET.on('move', function(data) {
  console.log('Aggiorno le posizioni');
  for (var a = 0; a < data.length; a++) {
    for (var i = 0; i < players.length; i++) {
      if (data[a].name == NAME) {
        players[i].x = data[a].x;
        players[i].y = data[a].y;
        players[i].direction = data[a].direction;
        break;
      }
      if (data[a].name == players[i].name) {
        players[i].element.style.top = Number(data[a].y) + 'px';
        players[i].element.style.left = Number(data[a].x) + 'px';
        players[i].x = data[a].x;
        players[i].y = data[a].y;
        players[i].direction = data[a].direction;
        players[i].element.src = getImage(data[a].image, data[a].direction);
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

SOCKET.on('log', function(data) {
  document.getElementById('logbox').innerHTML = data.message + '<br>' + document.getElementById('logbox').innerHTML;
});

SOCKET.on('disconnect', function() {
  alert("Connessione con il server persa!");
});

function removeArray(name, array) {
  var index = array.indexOf(name);
  if (index > -1) {
    array.splice(index, 1);
  }
}

function moveInterval(event) {
  lastKey = event.code;
}

function getImage(img, dir)
{
  dir = dir.toLowerCase();
  var temp = img.split("/");
  return temp[0] + "/" + dir + temp[1];
}
