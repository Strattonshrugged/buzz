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
// var $ = require('jQuery');
// var generateID = require('./generateID.js');

function Game(spokenID, gameID, ownerCookie, givenName, joinUrl) {
    this.spokenID = spokenID;       // more readable version of gameID Funky Chicken or Panda Cakewalk
    this.gameID = gameID;           // generated random key like funkychicken or pandacakewalk
    this.ownerCookie = ownerCookie; // random number fed as cookie to owner
    this.givenName = givenName;     // owner-chosen title of game
    this.joinUrl = joinUrl;         // cut and paste link to enter game
}

// TODO change database from array to dictionary, use gameID as key to locate object
var database = [
    {'spokenID' : 'Funky Chicken',
    'gameID' : 'funkychicken',
    'ownerCookie' : '123',
    'givenName' : 'Test Case',
    'joinUrl' : 'http://localhost:4000/g/funkychicken'}
];    //where all games are stored


// helper functions
function isValidName (name) {
    return name != '';
};

function converter(string)  {
    var str = string.replace(/\s/g, '').toLowerCase();
    return str;
};

function isValidGame(property)   {
    // console.log('isValidGame called');
    var condensed = converter(property);
    // console.log('isValidGame condensed value is ' + condensed);
    for (var i in database)  {
        if (database[i].gameID == condensed)   {
            return true;
        };
    };
    return false;
};

// unique ID generation
var randomWords1 = fs.readFileSync("randomWords1").toString().split('\n').filter(isValidName);
var randomWords2 = fs.readFileSync("randomWords2").toString().split('\n').filter(isValidName);

function createID() {
    // console.log('createID called');
    var spokenID = null;
    while (spokenID == null)   {
        var random1 = randomWords1[Math.floor(Math.random()*randomWords1.length)];
        var random2 = randomWords2[Math.floor(Math.random()*randomWords2.length)];
        var testID = random1 + " " + random2;
        var gameExists = isValidGame(testID);
        // console.log('back into createID from isValidGame, gameExists is ' + gameExists);
        if (gameExists == false) {
            spokenID = testID;
        }
    }
    // console.log('spokenID is being returned');
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
    // console.log('req.body follows ... ' + JSON.stringify(req.body));
    var option = req.body.radio;
    var id = converter(req.body.landingInput);
    if (option == 'player')   {
        // console.log('landingInput is ' + id);
        var idCheck = isValidGame(id);
        if (idCheck == false)    {
            res.render('landing', {'error' : 'Oh no! Cannot locate game'});
        }   else {
            // console.log('Before redirecting to app.get the id value is ' + id);
            res.redirect('/g/' + id);
        }
    }   else if (option == 'owner') { // here meaning radio button set to create new game not join existing one
        var newID = createID();
        // console.log('New ID is ' + newID);
        var randomKey = Math.floor((Math.random() * 10000));
        // console.log('randomKey is ' + randomKey);
        var game = new Game();
        game.spokenID = newID;
        game.gameID = converter(newID);
        game.ownerCookie = randomKey;
        game.givenName = req.body.landingInput;
        game.joinUrl = req.get('host') + req.path + '/' + converter(newID);

        console.log(JSON.stringify(database[0]));
        database.push(game);
        console.log(JSON.stringify(database[0]));
        console.log(JSON.stringify(database[1]));

        // console.log('Just pushed game to database as ' + JSON.stringify(game));

        res.cookie('gamebuzzer', randomKey);
        // console.log('gamebuzzer cookie has been set');
        // console.log('Before redirecting to app.get the id value is ' + id);
        res.redirect('/g/' + converter(newID));
    }   else {
        res.render('landing', {'error' : 'Something has gone horribly wrong'});
    }
})

// sending to game
app.get('/g/:id', function (req, res)   {
    var gameID = req.params.id;

function fetchObject (array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].gameID == gameID)   {
            return array[i];
        }
    }
}

    console.log('stringified index one in database ' + JSON.stringify(database[1]));
    console.log('gameID variable is ' + gameID);
    var gameObject = fetchObject(database);
    console.log('gameObject is ' + gameObject);
    console.log('gameObject stringified is ' + JSON.stringify(gameObject));

    if (req.cookies.gamebuzzer == gameObject.ownerCookie)  {
        // console.log('Owner template to be served!');
        res.render('owner', {'givenName' : gameObject.givenName,'spokenID' : gameObject.spokenID});
    }   else  {
        // console.log('Player template to be served!');
        res.render('player', {'givenName' : gameObject.givenName,'spokenID' : gameObject.spokenID});
    }
}) // end of app.get



// making connections
http.listen(4000, function(){
    console.log('listening on *:4000');
});
