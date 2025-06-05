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
    this.bullets = {}; // Track bullets on client
    //TODO add visuals for ending the game

    var minimap = document.getElementById("minimap");
    var mini_ctx = minimap.getContext("2d");

    var c = document.getElementById("main");
    var ctx = c.getContext("2d");
    
    // Store these in Game object for access in other functions
    Game.minimap = minimap;
    Game.mini_ctx = mini_ctx;
    Game.canvas = c;
    Game.ctx = ctx;
};

var startrunning = true;
Game.run = function() {
    // console.log('running game loop');
    var loops = 0, skipTicks = 1000 / Game.fps,
        maxFrameSkip = 2;
    if (startrunning) {
        Game.nextGameTick = (new Date).getTime();
        startrunning = false;
    }

    while ((new Date).getTime() > Game.nextGameTick && loops < maxFrameSkip) {
        updateCoordinates();
        //TODO: implement angle in PlayerUpdate
        socket.emit('PlayerUpdate', { id: Player.id, x: Player.x, y: Player.y, size: Player.size, color: Player.color, angle: Player.angle });
        // console.log ( 'sent player location to server' );
        Game.nextGameTick += skipTicks;
        loops++;
    }
    // draw as often as possible, only send updates fps a second
    // console.log ( 'drawing to canvas' );
    drawMinimap(Game.entities);
    drawMap(Game.entities, Game.grass, Game.bullets);
};

/*--------- Minimap drawing functionality --------*/
function drawMinimap(players) {
    var minimap = Game.minimap;
    var mini_ctx = Game.mini_ctx;
    
    if (!minimap || !mini_ctx) {
        console.error('Minimap not initialized');
        return;
    }
    
    // get a clean slate
    mini_ctx.clearRect(0, 0, minimap.width, minimap.height);
    
    // Draw border for visibility
    mini_ctx.strokeStyle = 'black';
    mini_ctx.strokeRect(0, 0, minimap.width, minimap.height);
    
    var scaleX = minimap.width / Game.width;
    var scaleY = minimap.height / Game.height;
    
    for (var key in players) {
        if (players[key] != null) {
            var player = players[key];
            var size, x, y;
            
            // Handle both array format [x, y, size, color] and object format {x, y, size, color, name, score}
            if (Array.isArray(player)) {
                x = player[0];
                y = player[1];
                size = player[2];
            } else {
                x = player.x;
                y = player.y;
                size = player.size;
            }
            
            var radius = Math.max(2, getRadius(size) * scaleX); // Minimum 2px for visibility
            var xPos = x * scaleX;
            var yPos = y * scaleY;
            var color = (Player.id == key) ? 'green' : 'red';
            
            drawMinimapCircle(radius, xPos, yPos, color);
        }
    }
}

function drawMinimapCircle(size, xPos, yPos, color) {
    var mini_ctx = Game.mini_ctx;
    mini_ctx.beginPath();
    mini_ctx.arc(xPos, yPos, size, 0, 2 * Math.PI);
    mini_ctx.fillStyle = color;
    mini_ctx.fill();
}
/*------------------------------------------------*/

/*----------- Map drawing functionality ----------*/
function drawMap(players, grass, bullets) {
    var c = Game.canvas;
    var ctx = Game.ctx;
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
            var player = players[key];
            var x, y, size, color;
            
            // Handle both array format [x, y, size, color] and object format {x, y, size, color, name, score}
            if (Array.isArray(player)) {
                x = player[0];
                y = player[1];
                size = player[2];
                color = player[3];
            } else {
                x = player.x;
                y = player.y;
                size = player.size;
                color = player.color;
            }
            
            var offsetX = x - Player.x;
            var offsetY = y - Player.y;
            var radius = getRadius(size);
            if (Math.abs(offsetX) < Width/2 + radius && Math.abs(offsetY) < Height/2 + radius) {
                drawCircle(radius, Width/2 + offsetX, Height/2 + offsetY, color);
                //TODO implement enemy ram
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
                    // Don't set to null here - wait for server confirmation
                    // grass[i] = null;
                }
                else {
                    //TODO make grass dynamic. Remove all instances of GRASS_SIZE
                    drawCircle(GRASS_SIZE, Width / 2 + offsetX, Height / 2 + offsetY, 'green');
                }
            }
        }
    }
    
    // Draw bullets
    if (bullets) {
        for (var bulletId in bullets) {
            var bullet = bullets[bulletId];
            if (bullet) {
                var offsetX = bullet.x - Player.x;
                var offsetY = bullet.y - Player.y;
                var bulletRadius = 8;
                
                if (Math.abs(offsetX) < Width/2 + bulletRadius && Math.abs(offsetY) < Height/2 + bulletRadius) {
                    drawCircle(bulletRadius, Width/2 + offsetX, Height/2 + offsetY, '#FFD700');
                }
            }
        }
    }
}

function drawCircle(size, xPos, yPos, color) {
    var ctx = Game.ctx;
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


