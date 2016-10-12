// the must-haves
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var ejs = require('ejs');
var bodyParser = require('body-parser');
app.use(bodyParser());
var cookieParser = require('cookie-parser');
app.use(cookieParser());

function Game(spokenID, gameID, ownerCookie, givenName, joinUrl) {
    this.spokenID = spokenID;       // more readable version of gameID Funky Chicken or Panda Cakewalk
    this.gameID = gameID;           // generated random key like funkychicken or pandacakewalk
    this.ownerCookie = ownerCookie; // random number fed as cookie to owner
    this.givenName = givenName;     // owner-chosen title of game
    this.joinUrl = joinUrl;         // cut and paste link to enter game
}

// game storage
var database = {
    "funkychicken" :
    {'spokenID' : 'Funky Chicken',
    'gameID' : 'funkychicken',
    'ownerCookie' : '123',
    'givenName' : 'the jungle, baby, we\'ve got fun and games ...',
    'joinUrl' : 'http://localhost:4000/g/funkychicken'}
};


// helper functions
function isValidName (name) {
    return name != '';
};

function condensor(string)  {
    var str = string.replace(/\s/g, '').toLowerCase();
    return str;
};

function isValidGame(property)   {
    var condensedName = condensor(property);
    if (database.condensedName == undefined)    {
        return false;
    }   else {
        return true;
    }


    // for (var i in database)  {
    //     if (database[i].gameID == condensed)   {
    //         return true;
    //     };
    // };
    // return false;
};

// unique ID generation
var randomWords1 = fs.readFileSync("randomWords1").toString().split('\n').filter(isValidName);
var randomWords2 = fs.readFileSync("randomWords2").toString().split('\n').filter(isValidName);

function createID() {
    var spokenID = null;
    while (spokenID == null)   {
        var random1 = randomWords1[Math.floor(Math.random()*randomWords1.length)];
        var random2 = randomWords2[Math.floor(Math.random()*randomWords2.length)];
        var testID = random1 + " " + random2;
        var gameExists = isValidGame(testID);
        if (gameExists == false) {
            spokenID = testID;
        }
    }
    return spokenID;
};

// templating and serving
app.use('/static', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/templates');

// first contact!
app.get('/', function(req, res){
    res.render('landing', {'error' : ''});
});

// receive input from landing
app.post('/g', function(req, res){
    var option = req.body.radio;
    var id = condensor(req.body.landingInput);
    if (option == 'player')   {
        var idCheck = isValidGame(id);
        if (idCheck == true)    {
            res.render('landing', {'error' : 'Oh no! Cannot locate game'});
        }   else {
            // console.log('redirect to /g/ + id is occurring');
            // console.log('redirect id is ' + id);
            res.redirect('/g/' + id);
        }
    }   else if (option == 'owner') { // here meaning radio button set to create new game not join existing one
        var newID = createID();
        var randomKey = Math.floor((Math.random() * 10000));
        var game = new Game();
        game.spokenID = newID;
        game.gameID = condensor(newID);
        game.ownerCookie = randomKey;
        game.givenName = req.body.landingInput;
        game.joinUrl = req.get('host') + req.path + '/' + condensor(newID);

        database[condensor(newID)] = game;

        // make new namespace for game
        console.log('database[condensor(newID)].gameID is ' + database[condensor(newID)].gameID)
        var nsp = io.of('/' + database[condensor(newID)].gameID);
        nsp.on('connection', function(socket){
            console.log('Socket connection detected');

            socket.on('chat message', function(msg){
                nsp.emit('chat message', msg);
            });

            socket.on('buzz in', function(msg){
                nsp.emit('buzz in', msg);
            });

            socket.on('reset gameboard', function(){
                nsp.emit('reset gameboard');
            });
        });
        // TODO save off namespace by gameID?

        res.cookie('gamebuzzer', randomKey);
        res.redirect('/g/' + condensor(newID));
    }   else {
        res.render('landing', {'error' : 'Something has gone horribly wrong'});
    }
});

// sending to game
app.get('/g/:id', function (req, res)   {
    var thisGame = req.params.id;
    // console.log('thisGame : ' + thisGame);
    // console.log('database : ' + JSON.stringify(database));
    // console.log('database[thisGame].ownerCookie : ' + database[thisGame].ownerCookie);

    if (req.cookies.gamebuzzer == database[thisGame].ownerCookie)  {
        res.render('owner', {'givenName' : database[thisGame].givenName,'spokenID' : database[thisGame].spokenID, 'gameID' : database[thisGame].gameID});
    }   else  {
        res.render('player', {'givenName' : database[thisGame].givenName,'spokenID' : database[thisGame].spokenID, 'gameID' : database[thisGame].gameID});
    }
});

// listening for connections
http.listen(4000, function(){
    console.log('listening on *:4000');
});
