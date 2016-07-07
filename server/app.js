var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');

const CONFIG = {
    PORT: 3000
};

io.on('connection', function(socket){
    console.log('a user connected');
    users.push(socket);
    socket.on('disconnect', userDisconnectHandler.bind(null, socket));
    socket.on('ice-candidate', iceCandidateHandler.bind(null, socket));
    socket.on('sdp-description', sdpDescriptionHandler.bind(null, socket));
    io.emit('user-connected', {
        user: serializeUser(socket)
    });
});

server.listen(CONFIG.PORT, function(){
    console.log('listening on port 3000');
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD');
    next();
});

var users = [];
var games = [];

// Get list of connected users for lobby
app.get('/connectedUsers', function(req, res) {
    var response = {};
    response.users = users.map(user => {
        return serializeUser(user);
    });
    res.json(response);
});

// Change display name of user
app.post('/user/:id/name', function(req, res) {
    var user = users.filter(user => {
        var serializedUser = serializeUser(user);
        return serializedUser.id === req.params.id;
    }).pop();

    if(user) {
        user.name = req.body.name;
    }

    res.json(serializeUser(user));

    io.emit('user-name-changed', {
        user: serializeUser(user)
    });
});

// Challenge user to a game
app.post('/user/:challengerId/challenge/:challengeeId', function(req, res) {
    var challenger = users.filter(user => {
        var serializedUser = serializeUser(user);
        return serializedUser.id === req.params.challengerId;
    }).pop();
    var challengee = users.filter(user => {
        var serializedUser = serializeUser(user);
        return serializedUser.id === req.params.challengeeId;
    }).pop();

    var response = {
        challenger: serializeUser(challenger),
        challengee: serializeUser(challengee)
    };

    challenger.emit('user-challenged', response);
    challengee.emit('user-challenged', response);
    res.json(response);
});

// Complete game
app.post('/challenge/:id/completed', function(req, res) {

});

function userDisconnectHandler(socket) {
    users = users.filter(user => {
        return user.id !== socket.id;
    });

    io.emit('user-disconnected', {
        user: serializeUser(socket)
    });

    console.log('a user disconnected!');
}

function serializeUser(user) {
    return {
        id: user.id.slice(2),
        name: user.name || user.id.slice(2)
    };
}

function sdpDescriptionHandler(socket, data) {
    var challenger = users.filter(user => {
        var serializedUser = serializeUser(user);
        return serializedUser.id === data.challengeData.challenger;
    }).pop();
    var challengee = users.filter(user => {
        var serializedUser = serializeUser(user);
        return serializedUser.id === data.challengeData.challengee;
    }).pop();

    if(challenger.id === socket.id) {
        challengee.emit('sdp-description', data);
    } else if(challengee.id === socket.id) {
        challenger.emit('sdp-description', data);
    }
}

function iceCandidateHandler(socket, data) {
    var challenger = users.filter(user => {
        var serializedUser = serializeUser(user);
        return serializedUser.id === data.challengeData.challenger;
    }).pop();
    var challengee = users.filter(user => {
        var serializedUser = serializeUser(user);
        return serializedUser.id === data.challengeData.challengee;
    }).pop();

    if(challenger.id === socket.id) {
        challengee.emit('ice-candidate', data);
    } else if(challengee.id === socket.id) {
        challenger.emit('ice-candidate', data);
    }
}