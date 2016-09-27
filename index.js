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

function game(spokenID, gameID, ownerCookie, givenName, joinUrl) {
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

// unique ID generation
function isValidName (name) {
    return name != '';
};

function converter(string)  {
    var str = string.replace(/\s/g, '').toLowerCase();
    return str;
};

var randomWords1 = fs.readFileSync("randomWords1").toString().split('\n').filter(isValidName);
var randomWords2 = fs.readFileSync("randomWords2").toString().split('\n').filter(isValidName);

function createID() {
    var spokenID = undefined;
    // so I need to generate an ID
    // then I need to check the ID, if it matches something go back to step one
    while (spokenID == undefined)   {
        var random1 = randomWords1[Math.floor(Math.random()*randomWords1.length)];
        var random2 = randomWords2[Math.floor(Math.random()*randomWords2.length)];
        var testID = random1 + " " + random2;
        var unique = true;
        for (var blah in database)  {
            if (database[blah].spokenID == testID)   {
                console.log('testing');
                unique = false;
            };
        }; // end of for loop
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

// switchboard
app.post('/g', function(req, res){
    console.log('req.body follows ... ' + JSON.stringify(req.body));
    var option = req.body.radio;
    var landingInput = converter(req.body.landingInput);
    if (option == 'player')   {
        // TODO substitute grep jquery here
        var id = undefined;
        for (var i = 0; i < database.length; i++)   {
            if (database[i].gameID == landingInput) {
                id = landingInput;
                console.log('gameID found, id changed to ' + id);
            }
        };
        if (id == undefined)    {
            res.render('landing', {'error' : 'Oh no! Cannot locate game'});
        }   else {
            res.redirect('/g/' + id);
        }
    }   else { // here meaning radio button set to create new game not join existing one

        // run create a game function
        // give them the cookieCode
        // send them over there as the owner

    }
})

// sending to game
app.get('/g/:id', function (req, res)   {
    var gameID = req.params.id;
    var index = undefined;
    //TODO substitute grep jquery here, finding game object location in database
    for (var i = 0; i < database.length; i++)   {
        if (database[i].gameID == gameID) {
            index = i;
            console.log('index changed to ' + i);
        }
    };
    if (req.cookies.gamebuzzer == database[index].ownerCookie)  {
        res.render('owner', {'givenName' : database[index].givenName,'spokenID' : database[index].spokenID});
    }   else {
        res.render('player', {'givenName' : database[index].givenName,'spokenID' : database[index].spokenID});
    }
}) // end of app.get



// NEXT tweak owner page to make sure it's receiving the above properties



// making connections
http.listen(4000, function(){
    console.log('listening on *:4000');
});
