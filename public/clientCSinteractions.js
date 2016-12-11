// setup my socket client
var socket = io();


socket.on('PlayerSetup', function (data) {
    Game.initialize();
    Player.initialize(data.id, data.coords, data.color);
    Game.entities = data.entities;
    Game.grass = data.grass;
    // Start the game loop

    setInterval(Game.run, 1000/Game.fps);
    // debugging player connection
    // socket.emit('setup', Player.id, Player.x, Player.y, Player.color);
});

socket.on('PlayerUpdate', function(data){
    Game.entities[data.id] = [data.x, data.y, data.size, data.color, data.radius];
});

//TODO make growth more dynamic, not just by one
socket.on('EatGrass', function () {
    Player.size +=GRASS_SIZE;
    Player.radius = getRadius(Player.size);
});

//TODO: figure out why this isnt working perfectly.
socket.on('GrassUpdate', function (data) {
    console.log('recieved GRASSSSSSS');
    Game.grass[data.id] = {x: data.x, y: data.y};
});