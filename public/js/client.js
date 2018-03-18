let DEBUG = false;
if(!DEBUG)
{
  console.log = function(){};
}

const IMAGES = ['player.png','zombie.png'];
const SOCKET = io();
const IMAGE = 'img/' + IMAGES[getRandomNumber(0,IMAGES.length)];
let GAME = '';
let GAME_X;
let GAME_Y;
const PLAYER_HEIGHT = 75;
const PLAYER_WIDTH = 75;
const SPEED = 5;
var NAME = '';
var players = [];
var player = '';
var direction = 'FORWARD';
var lastKey = '';

var zombie_count = 0;
var players_count = 0;

setTimeout(function(){
  GAME = document.getElementById('game');
  GAME_X = Number(window.getComputedStyle(GAME).getPropertyValue('width').replace("px",""));
  GAME_Y = Number(window.getComputedStyle(GAME).getPropertyValue('height').replace("px",""));
  spawnPlayer();
  setInterval(move, 20);
}, 500);

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
    if(data[i].type == "zombie")
    {
      zombie_count += 1;
    }
    else {
      players_count += 1;
    }
    players.push({element: p, name: data[i].name, type: data[i].type, x: data[i].x, y: data[i].y, direction: data[i].direction, image: data[i].image});
  }
  displayCounter();
});

SOCKET.on('update', function(data) {
  console.log('Nuovo giocatore connesso');
  var p = createPlayer(data.name, data.x, data.y,data.image, data.direction);
  players.push({element: p, name: data.name, type: data.type, x: data.x, y: data.y, direction: data.direction, image: data.image});
  if(data.type == "zombie")
  {
    zombie_count += 1;
  }
  else {
    players_count += 1;
  }
  displayCounter();
});

SOCKET.on('move', function(data) {
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
      if(players[i].type == "zombie")
      {
        zombie_count -= 1;
      }
      else
      {
        players_count -= 1;
      }
      players[i].element.remove();
      removeArray(players[i], players);
      break;
    }
  }
  displayCounter();
});

SOCKET.on('log', function(data) {
  document.getElementById('logbox').innerHTML = data.message + '<br>' + document.getElementById('logbox').innerHTML;
});

SOCKET.on('disconnect', function() {
  logBox("[Errore] Connessione con il server persa!");
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

function displayCounter()
{
  document.getElementById('logbox').innerHTML = "[Info] Zombie: " + zombie_count + " Umani: " + players_count + '<br>' + document.getElementById('logbox').innerHTML;

}

function logBox(text)
{
  document.getElementById('logbox').innerHTML = text + '<br>' + document.getElementById('logbox').innerHTML;
}
