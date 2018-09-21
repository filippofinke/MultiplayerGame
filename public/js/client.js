let DEBUG = true;
if(!DEBUG)
{
  console.log = function(){};
}

const IMAGES = ['player.png','zombie.png'];
var SOCKET;
var IMAGE = '';
let GAME = '';
let GAME_X;
let GAME_Y;
const PLAYER_HEIGHT = 75;
const PLAYER_WIDTH = 75;
const BULLET_HEIGHT = 25;
const BULLET_WIDTH = 50;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const BULLET_DAMAGE = 30;
const BULLET_IMAGE = 'img/arrow.png';
const MINE_SIZE = 50;
const MINE_DAMAGE = 99;
var NAME = '';
var TYPE = '';
var HEALTH = 100;
var players = [];
var player = '';
var direction = 'FORWARD';
var lastKey = '';
var lastLastKey = '';
var bushes = [];
var zombie_count = 0;
var players_count = 0;
var mines = [];
var dead = false;

var defaultPrevent=function(e){e.preventDefault();}
document.body.addEventListener("touchstart", defaultPrevent);
document.body.addEventListener("touchmove" , defaultPrevent);

function detectmob() {
 if( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
 ){
    return true;
  }
 else {
    return false;
  }
}

function documentLoaded()
{
  document.body.style.background = "";
  document.getElementById("container").style.display = "block";
  console.log("Gioco caricato.");

  var joystick = new VirtualJoystick({
          mouseSupport: true,
		      limitStickTravel: true,
		      stickRadius: 50
  });
  setInterval(function(){
    lastKey = (joystick.right()	? 'd'	: lastKey);
    lastKey = (joystick.up()	? 'w'	: lastKey);
    lastKey = (joystick.left()	? 'a'	: lastKey);
    lastKey = (joystick.down()	? 's'	: lastKey);
  }, 1);

  SOCKET = io();

  SOCKET.on('bushes', function(data){
    data.forEach(spawnBush);
  });

  SOCKET.on('log', function(data) {
    logBox(data.message);
  });

  SOCKET.on('bullet', function(data)
  {
    spawnCustomBullet(data.OWNER, data.X, data.Y, data.DIRECTION, data.SQUAD);
  });

  SOCKET.on('minescount', function(data){
    logBox("[Info] Hai ricevuto una nuova mina, ora ne hai: " + data.count);
    alertBox("<h1>Hai ricevuto una nuova mina, ora ne hai: " + data.count + "</h1>");
  });

  SOCKET.on('mines', function(data){
    data.forEach(function(element) {
      mines.push(spawnMine(element.X, element.Y, element.SQUAD, element.OWNER, MINE_SIZE, element.ID));
    });
  });

  SOCKET.on('newmine', function(data){
    var temp = spawnMine(data.X, data.Y, data.SQUAD, data.OWNER, MINE_SIZE, data.ID);
    mines.push(temp);
  });

  SOCKET.on('reconnect', function() {
    reconnect();
  });

  SOCKET.on('disconnect', function() {
    disconnect();
  });

  SOCKET.on('quit', function(data) {
    quit(data);
  });

  SOCKET.on('move', function(data) {
    moveplayers(data);
  });

  SOCKET.on('update', function(data) {
    update(data);
  });

  SOCKET.on('new', function(data) {
    newplayers(data);
  });

  SOCKET.on('playerscount', function(data) {
    playerscount(data);
  });

  SOCKET.on('exploded', function(data){
    exploded(data);
  });
}
function alertBox(message)
{
  document.getElementById("alert").innerHTML = message;
  document.getElementById("alert").style.display = "block";
  setTimeout(function(){
    document.getElementById("alert").style.display = "none";
  },2000);
}

function exploded(data)
{
  for(var i = 0; i < players.length; i++)
  {
    console.log(data.name + " " + players[i].name);
    if(players[i].name == data.name)
    {
      damage(players[i], MINE_DAMAGE);
    }
  }
  deleteMine(document.getElementById(data.id));
}

function playerscount(data)
{
  var zombies = data.zombies;
  var players = data.players;
  var index = 0;
  if(zombies > players)
    index = 0;
    else
    index = 1;
  IMAGE = 'img/' + IMAGES[index];
  GAME = document.getElementById('game');
  GAME_X = Number(window.getComputedStyle(GAME).getPropertyValue('width').replace("px",""));
  GAME_Y = Number(window.getComputedStyle(GAME).getPropertyValue('height').replace("px",""));
  spawnPlayer();
  setInterval(move, 20);
}

function setPlayers(players)
{
  document.getElementById("players").innerHTML = "<h1>Players: " + players + "</h1>";
}

function newplayers(data)
{
  console.log('Carico i giocatori');
  for (var i = 0; i < data.length; i++) {
    var p = '';
    if (data[i].name != NAME) {
      p = createPlayer(data[i].name, data[i].x, data[i].y,data[i].image, data[i].direction,100);
    } else {
      p = player;
      TYPE = data[i].type;
    }
    if(data[i].type == "zombie")
    {
      zombie_count += 1;
    }
    else {
      players_count += 1;
    }
    players.push({element: p, name: data[i].name, health: 100, type: data[i].type, x: data[i].x, y: data[i].y, direction: data[i].direction, image: data[i].image});
  }
  displayCounter();
}

function update(data)
{
  alertBox("<h1>Nuovo giocatore connesso!</h1>");
  console.log('Nuovo giocatore connesso');
  var p = createPlayer(data.name, data.x, data.y,data.image, data.direction);
  players.push({element: p, name: data.name, health: 100, type: data.type, x: data.x, y: data.y, direction: data.direction, image: data.image});
  if(data.type == "zombie")
  {
    zombie_count += 1;
  }
  else {
    players_count += 1;
  }
  displayCounter();
}

function moveplayers(data)
{
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
        players[i].element.getElementsByTagName("img")[0].src = getImage(data[a].image, data[a].direction);
      }
    }
  }
}

function quit(data)
{
  alertBox("<h1>Un utente si è disconnesso!</h1>");
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
}

function disconnect()
{
  if(dead)
  {
    document.getElementById("container").innerHTML = "";
    setTimeout(function(){
      window.location.reload(true);
    },1000);
    return;
  }
  logBox("[Errore] Connessione con il server persa!");
  window.location.reload(true);
}

function reconnect()
{
  logBox("[Errore] Il server ha chiesto di ricollegarsi!");
  setTimeout(function(){
    window.location.reload(true);
  },500);
}

function spawnPlayer() {
  NAME = SOCKET.id;
  var x = getRandomNumber(0, GAME_X - PLAYER_WIDTH);
  var y = getRandomNumber(0, GAME_Y - PLAYER_HEIGHT);
  var position = {
    X: x,
    Y: y,
    DIRECTION: direction,
    IMAGE: IMAGE
  };
  SOCKET.emit('new', position);

  player = createPlayer(NAME, x, y, IMAGE, direction, HEALTH);
}

function createPlayer(name, x, y, img, dir, health) {
  var playercont = document.createElement('div');
  playercont.className += 'player-container';
  var newplayer = document.createElement('img');
  newplayer.src = getImage(img, dir);
  newplayer.alt = name;
  newplayer.width = PLAYER_WIDTH;
  newplayer.height = PLAYER_HEIGHT;
  playercont.appendChild(newplayer);
  playercont.style.left = x + 'px';
  playercont.style.top = y + 'px';
  playercont.innerHTML += "<p class='health'>100%</p>";
  playercont.style.zIndex = "1";
  GAME.appendChild(playercont);
  return playercont;
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

  if(key == 'e')
  {
    SOCKET.emit('newmine', {
      SQUAD: TYPE,
      X: position.X,
      Y: position.Y,
      OWNER: SOCKET.id,
      ID: makeid()
    });
    key = lastLastKey;
    lastKey = lastLastKey;
  }

  switch (key) {

    case 'w':
    position.Y -= PLAYER_SPEED;
    direction = 'FORWARD';
    break;

    case 'a':
    position.X -= PLAYER_SPEED;
    direction = 'LEFT';
    break;

    case 's':
    position.Y += PLAYER_SPEED;
    direction = 'BACK';
    break;

    case 'd':
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

  for (var i = 0; i < mines.length; i++) {
    var mine = mines[i];

    var mp = {x1:mine.X,x2:mine.X + MINE_SIZE,y1:mine.Y,y2:mine.Y + MINE_SIZE};
    var pp = {x1:position.X,x2:position.X + PLAYER_WIDTH,y1:position.Y,y2:position.Y + PLAYER_HEIGHT};

    if( overlaps(pp,mp) && mine.SQUAD != TYPE && mine.EXPLODED == 0)
    {
      SOCKET.emit('exploded', {id:mine.ID, name: SOCKET.id});
    }
  }

  player.style.top = '' + position.Y + 'px';
  player.style.left = '' + position.X + 'px';
  player.getElementsByTagName("img")[0].src = getImage(IMAGE, direction);
  if(!detectmob())
    window.scrollTo(position.X - $(window).width()/2 + PLAYER_WIDTH/2, position.Y - $(window).height()/2 + PLAYER_HEIGHT/2);
  SOCKET.emit('move', position);
}

function overlaps(a, b) {
	if (a.x1 >= b.x2 || b.x1 >= a.x2) return false;
	if (a.y1 >= b.y2 || b.y1 >= a.y2) return false;
	return true;
}

function shot()
{
  console.log("Sparo verso: " + direction);
  var x =  Number(player.style.left.replace('px', ''));
  var y =  Number(player.style.top.replace('px', ''));
  var dir = direction;
  var data = {
    OWNER: NAME,
    SQUAD: TYPE,
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

function moveBullet(e, dir, blife, owner, squad)
{
  var x =  Number(e.style.left.replace('px', ''));
  var y =  Number(e.style.top.replace('px', ''));

  if (x < 0 ||
    x + BULLET_WIDTH > GAME_X ||
    y < 0 ||
    y + BULLET_HEIGHT > GAME_Y) {
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
      if(players[a].name != owner && players[a].type != squad)
      {
        damage(players[a]);
        deleteBullet(e, blife);
        logBox("[Info] " + owner + " ha colpito " + players[a].name + "!");
        break;
      }
    }
  }
}

function spawnCustomBullet(owner, x, y, dir, squad)
{
  console.log("Creato nuovo sparo verso " + direction + " di " + owner + "!");
  var bullet = document.createElement("img");
  bullet.style.width = BULLET_WIDTH + "px";
  bullet.style.height = BULLET_HEIGHT  + "px";
  bullet.src = getImage(BULLET_IMAGE, dir);
  bullet.style.left = (x + PLAYER_WIDTH/2 - BULLET_WIDTH/2) + "px";
  bullet.style.top = (y + PLAYER_HEIGHT/2 - BULLET_HEIGHT/2) + "px";
  GAME.appendChild(bullet);

  var blife = setInterval(function(){
    moveBullet(bullet, dir, blife,owner, squad);
  },20);
  setTimeout(function(){
    deleteBullet(bullet,blife);
  }, 3000);
}

function spawnBush(item, index)
{
  var bush = document.createElement('img');
  bush.src = item.image;
  bush.alt = "bush";
  bush.style.width = item.size + "px";
  bush.style.height = item.size + "px";
  bush.style.top = Number(item.y) + "px";
  bush.style.left = Number(item.x) + "px";
  bush.style.zIndex = "2";
  GAME.appendChild(bush);
}

function removeArray(name, array) {
  var index = array.indexOf(name);
  if (index > -1) {
    array.splice(index, 1);
  }
}

function damage(p, damage = BULLET_DAMAGE)
{
  var life = Number(p.element.getElementsByTagName("p")[0].innerHTML.replace("%","")) - damage;
  var color = "green";
  if(life < 30)
  {
    color = "red";
  }
  else if(life < 60)
  {
    color = "orange";
  }
  p.element.getElementsByTagName("p")[0].style.color = color;
  p.element.getElementsByTagName("p")[0].innerHTML = life + "%";

  if((life < 0 || life == 0))
  {
    p.element.remove();
    if(p.name == NAME)
    {
      dead = true;
      SOCKET.disconnect();
      document.body.style.backgroundImage = "url('img/deadscreen.gif')";
    }
  }
}

function moveInterval(event) {
  console.log(event);
  if(event.key == ' ')
  {
    event.preventDefault();
    shot();
    return;
  }
  else
  {
    lastLastKey = lastKey;
    lastKey = event.key;
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
  setPlayers(zombie_count + players_count);
  logBox("[Info] Zombie: " + zombie_count + " Umani: " + players_count);
}

function logBox(text)
{
  document.getElementById('logbox').innerHTML = text + '<br>' + document.getElementById('logbox').innerHTML;
}

function spawnMine(x,y,squad,owner, size, id)
{
  var mine = document.createElement('img');
  mine.src = "img/" + squad + "mine.png";
  mine.alt = "mine";
  mine.style.width = size + "px";
  mine.style.height = size + "px";
  mine.style.top = Number(y) + "px";
  mine.style.left = Number(x) + "px";
  mine.style.zIndex = "0";
  mine.setAttribute("id", id);
  GAME.appendChild(mine);
  var t = {
    MINE: mine,
    EXPLODED: 0,
    SQUAD: squad,
    X: x,
    Y: y,
    OWNER: owner,
    ID: id
  }
  return t;
}
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function deleteMine(e)
{
  e.src = "img/explosion.gif";
  setTimeout(function() {
    e.remove();
    var el = "";
    for(var i = 0; i < mines.length; i++)
    {
       if(mines[i].MINE == e)
       {
        mines.splice(i, 1);
        break;
       }
    }
  }, 1000);
}
