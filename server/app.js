var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const CONFIG = {
    PORT: 3000
};

io.on('connection', function(socket){
    console.log('a user connected');
    setupSocket(socket);
});

server.listen(CONFIG.PORT, function(){
    console.log('listening on port 3000');
});

var users = [];
var games = [];

// Get list of connected users for lobby
app.get('/connectedUsers', function(req, res) {
    console.log(io.sockets.connected);
    res.json({
        test: 'hello world!'
    });
});

// Change display name of user
app.post('/user/:id/name', function(req, res) {

});

// Challenge user to a game
app.post('/user/:id/challenge', function(req, res) {

});

// Complete game
app.post('/challenge/:id/completed', function(req, res) {

});

var socketEvents = [
    {
        eventName: 'user-connected',
        handler: userConnectedHandler
    }
];

function setupSocket(socket) {
    socketEvents.forEach(ev => {
        socket.on(ev.eventName, ev.handler);
    });
}

function userConnectedHandler(data) {
    io.emit('user-connected', {

    });
}