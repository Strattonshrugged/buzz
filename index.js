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
// var generateID = require('./generateID.js');

function Game(spokenID, gameID, ownerCookie, givenName, joinUrl) {
    this.spokenID = spokenID;       // more readable version of gameID Funky Chicken or Panda Cakewalk
    this.gameID = gameID;           // generated random key like funkychicken or pandacakewalk
    this.ownerCookie = ownerCookie; // random number fed as cookie to owner
    this.givenName = givenName;     // owner-chosen title of game
    this.joinUrl = joinUrl;         // cut and paste link to enter game
}

// game database including a test case
var database = [
    {'spokenID' : 'Funky Chicken',
    'gameID' : 'funkychicken',
    'ownerCookie' : '123',
    'givenName' : 'Test Case',
    'joinUrl' : 'http://localhost:4000/p/funkychicken'}
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
    var condensed = converter(property);
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
    var spokenID = null;
    while (spokenID == null)   {
        var random1 = randomWords1[Math.floor(Math.random()*randomWords1.length)];
        var random2 = randomWords2[Math.floor(Math.random()*randomWords2.length)];
        var testID = random1 + " " + random2;
        var unique = isValidGame(testID);
        if (unique == true) {
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
    console.log('req.body follows ... ' + JSON.stringify(req.body));
    var option = req.body.radio;
    if (option == 'player')   {
        var id = converter(req.body.landingInput);
        console.log('landingInput is ' + id);
        // TODO replace this loop with the jquery grep command
        var idCheck = isValidGame(id);

        if (idCheck == false)    {
            res.render('landing', {'error' : 'Oh no! Cannot locate game'});
        }   else {
            res.redirect('/g/' + id);
        }
    }   else { // here meaning radio button set to create new game not join existing one
        var newID = createID();
        var randomNumber = Math.floor((Math.random() * 10000));

        console.log(randomNumber);
        var game = new Game();
        game.spokenID = newID;
        game.gameID = converter(newID);
        game.ownerCookie = randomNumber;
        game.givenName = req.body.landingInput;
        game.joinUrl = req.get('host' + req.path);
        console.log(JSON.stringify(game));

        database.push(game);
        console.log('Just pushed ' + JSON.stringify(game) + 'to database');

        res.cookie('gamebuzzer', randomNumber);
        res.redirect('/g/' + id);
    }
})

// sending to game
app.get('/g/:id', function (req, res)   {
    var gameID = req.params.id;
    var index = null;
    //TODO substitute grep jquery here, finding game object location in database


    for (var i = 0; i < database.length; i++)   {
        if (database[i].gameID == gameID) {
            index = i;
            console.log('index changed to ' + i);
        }
    };
    if (req.cookies.gamebuzzer == database[index].ownerCookie)  {
        res.render('owner', {'givenName' : database[index].givenName,'spokenID' : database[index].spokenID});
    }   else  {
        res.render('player', {'givenName' : database[index].givenName,'spokenID' : database[index].spokenID});
    }
}) // end of app.get



// making connections
http.listen(4000, function(){
    console.log('listening on *:4000');
});
