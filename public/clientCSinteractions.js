// setup my socket client
var socket = io();

var gameInterval = null;

// Handle name input and game start
document.addEventListener('DOMContentLoaded', function() {
    var nameInput = document.getElementById('player-name');
    var playButton = document.getElementById('play-button');
    var nameScreen = document.getElementById('name-input-screen');
    var gameContainer = document.getElementById('container');
    
    function startGame() {
        var playerName = nameInput.value.trim() || 'Anonymous';
        socket.emit('JoinGame', playerName);
        nameScreen.style.display = 'none';
        gameContainer.style.display = 'block';
    }
    
    playButton.addEventListener('click', startGame);
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startGame();
        }
    });
});

socket.on('PlayerSetup', function (data) {
    Game.initialize();
    Player.initialize(data.id, data.coords, data.color, data.name);
    Player.score = 0;
    Game.entities = data.entities;
    Game.grass = data.grass;
    
    // Update health display with initial score
    updateScoreDisplay();
    
    // Clear any existing interval
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Start the game loop
    gameInterval = setInterval(Game.run, 1000/Game.fps);
    // debugging player connection
    // socket.emit('setup', Player.id, Player.x, Player.y, Player.color);
});


socket.on('PlayerRemove', function(data){
    delete Game.entities[data.id];
});

//TODO make growth more dynamic, not just by one
socket.on('EatGrass', function (data) {
    if (data && data.id !== undefined) {
        // Only update if server confirmed
        Game.grass[data.id] = null;
    }
    Player.size += GRASS_SIZE;
    Player.radius = getRadius(Player.size);
    
    // Update score if provided by server
    if (data && data.score !== undefined) {
        Player.score = data.score;
        updateScoreDisplay();
    }
});

//TODO: figure out why this isnt working perfectly.
socket.on('GrassUpdate', function (data) {
    console.log('recieved GRASSSSSSS');
    Game.grass[data.id] = {x: data.x, y: data.y};
});

socket.on('PlayerJoined', function(data) {
    Game.entities[data.id] = data.data;
});

socket.on('LeaderboardUpdate', function(leaderboard) {
    updateLeaderboard(leaderboard);
});

function updateScoreDisplay() {
    var healthText = document.getElementById('health-text');
    if (healthText && Player.score !== undefined) {
        healthText.textContent = 'Score: ' + Player.score;
    }
}

function updateLeaderboard(leaderboard) {
    var leaderboardElement = document.getElementById('leaderboard');
    if (!leaderboardElement) return;
    
    leaderboardElement.innerHTML = '';
    
    leaderboard.forEach(function(player, index) {
        var li = document.createElement('li');
        
        var nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = (index + 1) + '. ' + player.name;
        
        var scoreSpan = document.createElement('span');
        scoreSpan.className = 'player-score';
        scoreSpan.textContent = player.score;
        
        li.appendChild(nameSpan);
        li.appendChild(scoreSpan);
        leaderboardElement.appendChild(li);
    });
}

// Handle bullet-related events
socket.on('BulletCreated', function(bullet) {
    Game.bullets[bullet.id] = bullet;
});

// Handle player size reduction when shooting
socket.on('PlayerUpdate', function(data){
    Game.entities[data.id] = [data.x, data.y, data.size, data.color, data.angle];
    
    // Update our own player size if this update is for us
    if (data.id === Player.id) {
        Player.size = data.size;
        Player.radius = getRadius(Player.size);
    }
});

socket.on('BulletRemoved', function(data) {
    delete Game.bullets[data.id];
});

socket.on('BulletsUpdate', function(bullets) {
    // Update bullet positions
    for (var bulletId in bullets) {
        if (Game.bullets[bulletId]) {
            Game.bullets[bulletId].x = bullets[bulletId].x;
            Game.bullets[bulletId].y = bullets[bulletId].y;
        } else {
            Game.bullets[bulletId] = bullets[bulletId];
        }
    }
});

socket.on('BulletHit', function(data) {
    // Update player size if it's us
    if (data.playerId === Player.id) {
        Player.size = data.newSize;
        Player.radius = getRadius(Player.size);
        Player.score = data.newScore;
        updateScoreDisplay();
    }
    
    // Update shooter's score if it's us  
    if (data.shooterId === Player.id) {
        Player.score = Game.entities[Player.id] ? Game.entities[Player.id].score : Player.score + 10;
        updateScoreDisplay();
    }
    
    // Remove the bullet
    delete Game.bullets[data.bulletId];
});