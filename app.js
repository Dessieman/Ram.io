var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static('public'));
var port = 3001;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    // Assign id between 1 and 1000
    var id = Math.floor(Math.random()*1000 + 1);
    // x,y coordinates
    var coords = [Math.floor(Math.random()*Game.width), Math.floor(Math.random()*Game.height)];
    var color = randomColor(150);
    Game.entities[id] = [coords[0],coords[1],10, color];
    // Send an id and coordinates for the player to spawn at
    socket.emit('PlayerSetup', { id: id, coords: coords, color: color, entities: Game.entities,grass: Game.grass });
    /* debugging player connection
    socket.on('setup', function (id,x,y,color) {
        console.log(id + " setup at " + x + "," + y + " with color " + color);
    });
    */

    socket.on('PlayerUpdate', function(data){
        socket.broadcast.emit('PlayerUpdate', data);
        Game.entities[data.id] = [data.x, data.y, data.size, data.color, data.angle];
    });
    // player is attempting to eat a piece of grass
    socket.on('EatRequest', function(data){
        if (Game.grass[data.id].x == data.x && Game.grass[data.id].y == data.y) {
            // tell client they succesfully ate grass
            socket.emit('EatGrass');
            Game.grass[data.id] = false;
            // If grass has been eaten in a verified manner, replace that piece of grass with another. Send to ALL
            var replacementgrass = generateGrass();
            io.emit('GrassUpdate', {id: data.id, x: replacementgrass.x, y: replacementgrass.y});
        }
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
        //TODO write code to log final death of disconnected client if possible
    });
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});

//Server-side game logic
var Game = {};

// fps denotes times game will be updated per second and sent out to players
Game.fps = 30;
Game.width = 10000;
Game.height = 10000;
Game.numGrass = 500;

Game.initialize = function() {
    Game.entities = [];
    Game.grass = [];
    var i;
    for (i = 0; i < Game.numGrass; i++) {
        Game.grass.push(generateGrass());
    }
    //TODO add conditions for ending the game
    this.gamestart = (new Date).getTime;
};
var startrunning = true;
Game.run = function() {
    // console.log('running game loop');
    var loops = 0, skipTicks = 1000 / Game.fps,
        maxFrameSkip = 10;
        if (startrunning) {
        nextGameTick = (new Date).getTime();
        startrunning = false;
    }

        while ((new Date).getTime() > nextGameTick) {
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

