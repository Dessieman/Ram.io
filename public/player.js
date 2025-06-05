/**
 * Created by Chris Brajer on 12/7/2016.
 */
var Player = {};
var MOUSEFREQ = 50;
var RADIUS_FACTOR = .80;

Player.size = 50;
Player.speed = 5;
Player.radius = getRadius(Player.size);
var img = new Image();
img.src = "/resources/playerRamio.svg";

var enemyRam = new Image();
enemyRam.src = "/resources/enemyRam.svg";

Player.initialize = function(id, position, color, name) {
    this.id = id;
    this.x = position[0];
    this.y = position[1];
    this.color = color;
    this.name = name || 'Anonymous';
    this.score = 0;
    this.mouseX = 800;
    this.mouseY = 450;
};

//Listening for mouse position changes
window.addEventListener('mousemove', mouseHandler, false);

//Listening for mouse clicks to shoot
window.addEventListener('click', clickHandler, false);

function mouseHandler(e) {
    if (Game.canvas) {
        getMousePos(Game.canvas, e);
    }
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    Player.mouseX = (evt.clientX - rect.left) * scaleX;  // scale mouse coordinates after they have
    Player.mouseY = (evt.clientY - rect.top) * scaleY;   // been adjusted to be relative to element
}

function clickHandler(e) {
    if (!Player.id || !Game.canvas) return;
    
    // Prevent shooting if player is too small
    if (Player.size <= 15) return;
    
    var canvas = Game.canvas;
    var angle = Math.atan2(Player.mouseY - canvas.height/2, Player.mouseX - canvas.width/2);
    
    // Calculate bullet spawn position slightly in front of player
    var spawnDistance = Player.radius + 10;
    var bulletX = Player.x + Math.cos(angle) * spawnDistance;
    var bulletY = Player.y + Math.sin(angle) * spawnDistance;
    
    // Send shoot request to server
    socket.emit('ShootBullet', {
        x: bulletX,
        y: bulletY,
        angle: angle
    });
}

function updateCoordinates() {
    if (!Player.id || !Game.canvas) return;
    
    var c = Game.canvas;
    Player.angle = Math.atan2( Player.mouseY-c.height/2, Player.mouseX-c.width/2 );
    Player.x += Player.speed * Math.cos(Player.angle);
    Player.y += Player.speed * Math.sin(Player.angle);
    
    // Boundary checking
    Player.x = Math.max(0, Math.min(Game.width, Player.x));
    Player.y = Math.max(0, Math.min(Game.height, Player.y));
    
    Game.entities[Player.id] = [Player.x, Player.y, Player.size, Player.color];
}

//TODO: How do we want to scale radius?
function getRadius(size) {
    //return Math.sqrt(size);
    return Math.pow(size, RADIUS_FACTOR)
}