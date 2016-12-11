/**
 * Created by Chris Brajer on 12/7/2016.
 */
//Client-side game logic
var Game = {};
// curently static grass patch size
var GRASS_SIZE = 10;
var SVG_MULTIPLIER = 1.6;

// fps denotes times game will be updated per second and sent out to server
Game.fps = 45;
Game.width = 10000;
Game.height = 10000;

Game.initialize = function() {
    this.entities = [];
    this.grass = [];
    //TODO add visuals for ending the game

    minimap = document.getElementById("minimap");
    mini_ctx = minimap.getContext("2d");

    c = document.getElementById("main");
    ctx = c.getContext("2d");
};

var startrunning = true;
Game.run = function() {
    // console.log('running game loop');
    var loops = 0, skipTicks = 1000 / Game.fps,
        maxFrameSkip = 2;
    if (startrunning) {
        nextGameTick = (new Date).getTime();
        startrunning = false;
    }

    while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
        updateCoordinates();
        //TODO: implement angle in PlayerUpdate
        socket.emit('PlayerUpdate', { id: Player.id, x: Player.x, y: Player.y, size: Player.size, color: Player.color, angle: Player.angle });
        // console.log ( 'sent player location to server' );
        nextGameTick += skipTicks;
        loops++;
    }
    // draw as often as possible, only send updates fps a second
    // console.log ( 'drawing to canvas' );
    drawMinimap(Game.entities);
    drawMap(Game.entities, Game.grass);
};

/*--------- Minimap drawing functionality --------*/
function drawMinimap(players) {

    // get a clean slate
    mini_ctx.clearRect(0, 0, minimap.width, minimap.height);
    var scaleX = minimap.width / Game.width;
    var scaleY = minimap.height / Game.height;
    for (var key in players) {
        if (players[key] != null && Player.id != key) {
            //TODO make sure that scaleX is the correct size
            drawMinimapCircle(getRadius(players[key][2]) * scaleX,players[key][0] * scaleX,players[key][1] * scaleY,'red');
        }
        else if (Player.id == key) {
            drawMinimapCircle(getRadius(players[key][2]) * scaleX,players[key][0] * scaleX,players[key][1] * scaleY,'green');
        }
    }
}

function drawMinimapCircle(size, xPos, yPos, color) {
    mini_ctx.beginPath();
    mini_ctx.arc(xPos, yPos, size, 0, 2 * Math.PI);
    mini_ctx.fillStyle = color;
    mini_ctx.fill();
}
/*------------------------------------------------*/

/*----------- Map drawing functionality ----------*/
function drawMap(players,grass) {
    var Width = c.width;
    var Height = c.height;
    //TODO have spacing be controlled based on the size of the player
    var GridSize = 80;

    // get a clean slate
    ctx.clearRect(0, 0, c.width, c.height);
    var i;
    for (i = -(Player.y % GridSize); i < Height; i += GridSize) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(0, i);
        ctx.lineTo(Width, i);
        ctx.stroke();
        ctx.closePath();
    }
    for (i = -(Player.x % GridSize); i < Width; i += GridSize) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(i, 0);
        ctx.lineTo(i, Height);
        ctx.stroke();
        ctx.closePath();
    }

    for (var key in players) {
        if (Player.id != key && players[key] != null) {
            //TODO implement enemy ram
            var offsetX = players[key][0] - Player.x;
            var offsetY = players[key][1] - Player.y;
            var radius = getRadius(players[key][2]);
            if (Math.abs(offsetX) < Width/2 + radius && Math.abs(offsetY) < Height/2 + radius) {
                drawCircle(radius, Width/2 + offsetX, Height/2 + offsetY, players[key][3]);
                //TODO Make this a function?
                // rotateAndPaintImage(ctx, img, Player.angle, Width/2 - Player.radius/2, Height/2 - Player.radius/2, Player.radius, Player.radius );
                // ctx.translate(Width/2 + offsetX, Height/2 + offsetY);
                // ctx.rotate(players[key][4] - Math.PI/2);
                // ctx.drawImage(enemyRam,-radius,-Player.radius,2*players[key][3],2*players[key][3]);
                // ctx.rotate(-players[key][4] + Math.PI/2);
                // ctx.translate(-Width/2 - offsetX, -Height/2 - offsetY);

            }
        }
    }
    //TODO Make this a function?
    // rotateAndPaintImage(ctx, img, Player.angle, Width/2 - Player.radius/2, Height/2 - Player.radius/2, Player.radius, Player.radius );
    ctx.translate(Width/2, Height/2);
    ctx.rotate(Player.angle - Math.PI/2);
    ctx.drawImage(img,-Player.radius,-Player.radius,2*Player.radius,2*Player.radius);
    ctx.rotate(-Player.angle + Math.PI/2);
    ctx.translate(-Width/2, -Height/2);
    // drawCircle(Player.radius, Width/2, Height/2, Player.color);

    for (i = 0; i < grass.length; i++) {
        if (grass[i] != null) {
            var offsetX = grass[i].x - Player.x;
            var offsetY = grass[i].y - Player.y;
            if (Math.abs(offsetX) < Width / 2 + GRASS_SIZE && Math.abs(offsetY) < Height / 2 + GRASS_SIZE) {
                if (Math.abs(offsetX) < Player.radius + GRASS_SIZE && Math.abs(offsetY) < Player.radius + GRASS_SIZE) {
                    socket.emit('EatRequest', {id: i, x: grass[i].x, y: grass[i].y});
                    grass[i] = null;
                }
                else {
                    //TODO make grass dynamic. Remove all instances of GRASS_SIZE
                    drawCircle(GRASS_SIZE, Width / 2 + offsetX, Height / 2 + offsetY, 'green');
                }
            }
        }
    }
}

function drawCircle(size, xPos, yPos, color) {
    ctx.beginPath();
    ctx.arc(xPos, yPos, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}
/*-------------------------------------------------*/

function log2(val) {
    return Math.log(val) / Math.LN2;
}

function rotateAndPaintImage ( context, image, angleInRad , positionX, positionY, axisX, axisY ) {
    context.translate( positionX, positionY );
    context.rotate( angleInRad );
    context.drawImage( image, -axisX, -axisY );
    context.rotate( -angleInRad );
    context.translate( -positionX, -positionY );
}


