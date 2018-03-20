let DEBUG = true;
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
const BULLET_HEIGHT = 25;
const BULLET_WIDTH = 25;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const BULLET_IMAGE = 'img/bullet.png';
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
    position.Y -= PLAYER_SPEED;
    direction = 'FORWARD';
    break;

    case 'KeyA':
    position.X -= PLAYER_SPEED;
    direction = 'LEFT';
    break;

    case 'KeyS':
    position.Y += PLAYER_SPEED;
    direction = 'BACK';
    break;

    case 'KeyD':
    position.X += PLAYER_SPEED;
    direction = 'RIGHT';
    break;
    default:
    break;
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
  SOCKET.emit('move', position);
}

function shot()
{
  console.log("Sparo verso: " + direction);
  var x =  Number(player.style.left.replace('px', ''));
  var y =  Number(player.style.top.replace('px', ''));
  var dir = direction;
  var data = {
    OWNER: NAME,
    X: x,
    Y: y,
    DIRECTION: dir
  }
  SOCKET.emit('newbullet', data);
}

function deleteBullet(element, blife)
{
  clearInterval(blife);
  element.remove();
}

function moveBullet(e, dir, blife, owner)
{
  var x =  Number(e.style.left.replace('px', ''));
  var y =  Number(e.style.top.replace('px', ''));

  if (x < 0 ||
    x > GAME_X ||
    y < 0 ||
    y > GAME_Y) {
      deleteBullet(e, blife);
  }

  if(dir == 'FORWARD')
  {
      e.style.top = y - BULLET_SPEED + "px";
  }
  else if(dir == 'LEFT')
  {
      e.style.left = x - BULLET_SPEED + "px";
  }
  else if(dir == 'RIGHT')
  {
      e.style.left = x + BULLET_SPEED + "px";
  }
  else if(dir == 'BACK')
  {
    e.style.top = y + BULLET_SPEED + "px";
  }

  for(var a = 0; a < players.length; a++)
  {
    var min_x = Number(players[a].element.style.left.replace("px",""));
    players[a].x = min_x;
    var min_y = Number(players[a].element.style.top.replace("px",""));
    players[a].x = min_y;
    var max_x = min_x + PLAYER_WIDTH;
    var max_y = min_y + PLAYER_HEIGHT;
    if(x>= min_x && x <= max_x && y >= min_y && y <= max_y || x + BULLET_WIDTH>= min_x && x + BULLET_WIDTH <= max_x && y + BULLET_HEIGHT >= min_y && y + BULLET_HEIGHT <= max_y)
    {
      if(players[a].name != owner)
      {
        console.log("Era di " + owner + " Colpito: "+ players[a].name);
        deleteBullet(e, blife);
        logBox("[Info] " + owner + " ha colpito " + players[a].name + "!");
        break;
      }
    }
  }
}

function spawnCustomBullet(owner, x, y, dir)
{
  console.log("Creato nuovo sparo verso " + direction + " di " + owner + "!");
  var bullet = document.createElement("img");
  bullet.style.width = BULLET_WIDTH + "px";
  bullet.style.height = BULLET_HEIGHT  + "px";
  bullet.src = BULLET_IMAGE;
  bullet.style.left = (x + PLAYER_WIDTH/2 - BULLET_WIDTH/2) + "px";
  bullet.style.top = (y + PLAYER_HEIGHT/2 - BULLET_HEIGHT/2) + "px";
  GAME.appendChild(bullet);

  var blife = setInterval(function(){
    moveBullet(bullet, dir, blife,owner);
  },20);
  setTimeout(function(){
    deleteBullet(bullet,blife);
  }, 3000);
}

SOCKET.on('bullet', function(data)
{
  spawnCustomBullet(data.OWNER, data.X, data.Y, data.DIRECTION);
});

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
      }
      else if (data[a].name == players[i].name) {
        players[i].element.style.top = Number(data[a].y) + 'px';
        players[i].element.style.left = Number(data[a].x) + 'px';
        players[i].x = Number(data[a].x);
        players[i].y = Number(data[a].y);
        players[i].direction = data[a].direction;
        players[i].element.src = getImage(data[a].image, data[a].direction);
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
  if(event.code == 'Space')
  {
    shot();
  }
  else
  {
    lastKey = event.code;
  }
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
