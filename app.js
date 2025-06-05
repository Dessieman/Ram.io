var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static('public'));
var port = process.env.PORT || 3001;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

// Generate unique IDs using timestamp + random
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

io.on('connection', function(socket){
    console.log('a user connected');
    var id = null;
    var playerData = null;
    
    socket.on('JoinGame', function(name) {
        // Validate name
        if (!name || typeof name !== 'string') {
            name = 'Anonymous';
        }
        name = name.trim().substring(0, 20);
        if (!name) name = 'Anonymous';
        
        // Generate unique ID
        id = generateUniqueId();
        // x,y coordinates
        var coords = [Math.floor(Math.random()*Game.width), Math.floor(Math.random()*Game.height)];
        var color = randomColor(150);
        
        // Store player data with name and score
        playerData = {
            x: coords[0],
            y: coords[1],
            size: 10,
            color: color,
            name: name,
            score: 0
        };
        
        Game.entities[id] = playerData;
        
        // Send setup data to the joining player
        socket.emit('PlayerSetup', { 
            id: id, 
            coords: coords, 
            color: color, 
            name: name,
            entities: Game.entities,
            grass: Game.grass 
        });
        
        // Notify all other players about the new player
        socket.broadcast.emit('PlayerJoined', { id: id, data: playerData });
        
        // Send initial leaderboard
        io.emit('LeaderboardUpdate', getLeaderboard());
    });
    /* debugging player connection
    socket.on('setup', function (id,x,y,color) {
        console.log(id + " setup at " + x + "," + y + " with color " + color);
    });
    */

    socket.on('PlayerUpdate', function(data){
        // Skip if player hasn't joined yet
        if (!id || !Game.entities[id]) {
            return;
        }
        
        // Validate input
        if (!data || typeof data.id !== 'string' || 
            typeof data.x !== 'number' || typeof data.y !== 'number' ||
            typeof data.size !== 'number' || typeof data.color !== 'string') {
            return;
        }
        
        // Validate boundaries
        if (data.x < 0 || data.x > Game.width || 
            data.y < 0 || data.y > Game.height) {
            return;
        }
        
        // Validate size (prevent cheating)
        if (data.size < 10 || data.size > 1000) {
            return;
        }
        
        // Only allow updates for the player's own ID
        if (data.id !== id) {
            return;
        }
        
        // Update player data while preserving name and score
        if (Game.entities[data.id]) {
            Game.entities[data.id].x = data.x;
            Game.entities[data.id].y = data.y;
            Game.entities[data.id].size = data.size;
            Game.entities[data.id].color = data.color;
            Game.entities[data.id].angle = data.angle;
        }
        
        socket.broadcast.emit('PlayerUpdate', data);
    });
    // player is attempting to eat a piece of grass
    socket.on('EatRequest', function(data){
        // Skip if player hasn't joined yet
        if (!id || !Game.entities[id]) {
            return;
        }
        
        // Validate input
        if (!data || typeof data.id !== 'number' || 
            typeof data.x !== 'number' || typeof data.y !== 'number') {
            return;
        }
        
        // Check if grass exists and matches position
        if (Game.grass[data.id] && 
            Game.grass[data.id].x == data.x && 
            Game.grass[data.id].y == data.y) {
            
            // Award points for eating grass
            Game.entities[id].score += 10;
            
            // tell client they successfully ate grass
            socket.emit('EatGrass', { id: data.id, score: Game.entities[id].score });
            Game.grass[data.id] = null;
            
            // If grass has been eaten in a verified manner, replace that piece of grass with another. Send to ALL
            var replacementgrass = generateGrass();
            Game.grass[data.id] = replacementgrass;
            io.emit('GrassUpdate', {id: data.id, x: replacementgrass.x, y: replacementgrass.y});
            
            // Update leaderboard
            io.emit('LeaderboardUpdate', getLeaderboard());
        }
    });
    
    socket.on('ShootBullet', function(data) {
        // Skip if player hasn't joined yet
        if (!id || !Game.entities[id]) {
            return;
        }
        
        // Validate input
        if (!data || typeof data.angle !== 'number' || 
            typeof data.x !== 'number' || typeof data.y !== 'number') {
            return;
        }
        
        var player = Game.entities[id];
        
        // Check if player has enough size to shoot (minimum 15)
        if (player.size <= 15) {
            return;
        }
        
        // Reduce player size and score for shooting
        var sizeCost = 5;
        player.size -= sizeCost;
        player.score = Math.max(0, player.score - 5);
        
        // Create bullet
        var bulletId = generateUniqueId();
        var bulletSpeed = 8;
        Game.bullets[bulletId] = {
            id: bulletId,
            x: data.x,
            y: data.y,
            dx: Math.cos(data.angle) * bulletSpeed,
            dy: Math.sin(data.angle) * bulletSpeed,
            ownerId: id,
            damage: 10,
            timeCreated: Date.now(),
            ttl: 3000 // 3 seconds time to live
        };
        
        // Broadcast bullet creation to all clients
        io.emit('BulletCreated', Game.bullets[bulletId]);
        
        // Update player size on all clients
        io.emit('PlayerUpdate', { 
            id: id, 
            x: player.x, 
            y: player.y, 
            size: player.size, 
            color: player.color, 
            angle: player.angle 
        });
        
        // Update leaderboard
        io.emit('LeaderboardUpdate', getLeaderboard());
    });

    socket.on('disconnect', function(){
        console.log('user disconnected:', id);
        // Clean up player entity
        if (id) {
            delete Game.entities[id];
            // Broadcast removal to other players
            socket.broadcast.emit('PlayerRemove', { id: id });
            // Update leaderboard
            io.emit('LeaderboardUpdate', getLeaderboard());
        }
    });
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});

//Server-side game logic
var Game = {};

// fps denotes times game will be updated per second and sent out to players
Game.fps = 45; // Match client FPS
Game.width = 10000;
Game.height = 10000;
Game.numGrass = 500;

Game.initialize = function() {
    Game.entities = {}; // Use object for O(1) lookups
    Game.bullets = {};  // Track bullets
    Game.grass = [];
    var i;
    for (i = 0; i < Game.numGrass; i++) {
        Game.grass.push(generateGrass());
    }
    //TODO add conditions for ending the game
    this.gamestart = (new Date).getTime();
};
var startrunning = true;
var nextGameTick;
Game.run = function() {
    // console.log('running game loop');
    var loops = 0, skipTicks = 1000 / Game.fps,
        maxFrameSkip = 10;
        if (startrunning) {
        nextGameTick = (new Date).getTime();
        startrunning = false;
    }

        while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
            // Update bullet positions and check for collisions
            updateBullets();
            // console.log('emitted game update');
            nextGameTick += skipTicks;
            loops++;
        }
};

// Start the game loop
Game.initialize();
setInterval(Game.run, 1000/Game.fps);

function randomColor(brightness){
    function randomChannel(brightness){
        var r = 255-brightness;
        var n = 0|((Math.random() * r) + brightness);
        var s = n.toString(16);
        return (s.length==1) ? '0'+s : s;
    }
    return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

function generateGrass () {
    var coords = {};
    coords.x = Math.floor(Math.random()*Game.width);
    coords.y = Math.floor(Math.random()*Game.height);
    return coords;
}

function updateBullets() {
    var currentTime = Date.now();
    var bulletsToRemove = [];
    
    for (var bulletId in Game.bullets) {
        var bullet = Game.bullets[bulletId];
        
        // Remove expired bullets
        if (currentTime - bullet.timeCreated > bullet.ttl) {
            bulletsToRemove.push(bulletId);
            continue;
        }
        
        // Update bullet position
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        
        // Remove bullets that go out of bounds
        if (bullet.x < 0 || bullet.x > Game.width || 
            bullet.y < 0 || bullet.y > Game.height) {
            bulletsToRemove.push(bulletId);
            continue;
        }
        
        // Check collision with players (except owner)
        for (var playerId in Game.entities) {
            if (playerId === bullet.ownerId) continue;
            
            var player = Game.entities[playerId];
            var dx = bullet.x - player.x;
            var dy = bullet.y - player.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var playerRadius = Math.pow(player.size, 0.80); // Same formula as getRadius
            
            if (distance < playerRadius + 8) { // 8px bullet radius
                // Hit! Apply damage
                player.size = Math.max(10, player.size - bullet.damage);
                player.score = Math.max(0, player.score - bullet.damage);
                
                // Award points to shooter
                if (Game.entities[bullet.ownerId]) {
                    Game.entities[bullet.ownerId].score += bullet.damage;
                }
                
                // Notify all clients of hit
                io.emit('BulletHit', {
                    bulletId: bulletId,
                    playerId: playerId,
                    newSize: player.size,
                    newScore: player.score,
                    shooterId: bullet.ownerId
                });
                
                bulletsToRemove.push(bulletId);
                
                // Update leaderboard after hit
                io.emit('LeaderboardUpdate', getLeaderboard());
                break;
            }
        }
    }
    
    // Remove bullets and notify clients
    bulletsToRemove.forEach(function(bulletId) {
        delete Game.bullets[bulletId];
        io.emit('BulletRemoved', { id: bulletId });
    });
    
    // Broadcast updated bullet positions
    if (Object.keys(Game.bullets).length > 0) {
        io.emit('BulletsUpdate', Game.bullets);
    }
}

function getLeaderboard() {
    var players = [];
    for (var id in Game.entities) {
        var player = Game.entities[id];
        players.push({
            id: id,
            name: player.name,
            score: player.score,
            size: player.size
        });
    }
    
    // Sort by score descending
    players.sort(function(a, b) {
        return b.score - a.score;
    });
    
    // Return top 10 players
    return players.slice(0, 10);
}

