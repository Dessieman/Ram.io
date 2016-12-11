/**
 * Created by Chris Brajer on 12/7/2016.
 */
var Player = {};
MOUSEFREQ = 50;
RADIUS_FACTOR = .80;

Player.size = 50;
Player.speed = 5;
Player.radius = getRadius(Player.size);
img = new Image();
img.src = "/resources/playerRamio.svg";

enemyRam = new Image();
enemyRam.src = "/resources/enemyRam.svg";

Player.initialize = function(id, position, color) {
    this.id = id;
    this.x = position[0];
    this.y = position[1];
    this.color = color;
    this.mouseX = 800;
    this.mouseY = 450;
};

//Listening for mouse position changes
window.addEventListener('mousemove', mouseHandler, false);

function mouseHandler(e) {
    getMousePos(c, e)
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    Player.mouseX = (evt.clientX - rect.left) * scaleX;  // scale mouse coordinates after they have
    Player.mouseY = (evt.clientY - rect.top) * scaleY;   // been adjusted to be relative to element
}

function updateCoordinates() {
    //TODO do we need to make sure that player has been initialized? if(Player.id) {}
    Player.angle = Math.atan2( Player.mouseY-c.height/2, Player.mouseX-c.width/2 )/**(180/Math.PI)*/;
    Player.x += Player.speed * Math.cos(Player.angle);
    Player.y += Player.speed * Math.sin(Player.angle);
    Game.entities[Player.id] = [Player.x, Player.y, Player.size, Player.color];
}

//TODO: How do we want to scale radius?
function getRadius(size) {
    //return Math.sqrt(size);
    return Math.pow(size, RADIUS_FACTOR)
}