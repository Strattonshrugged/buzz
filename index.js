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

// game databases including a test case
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

// owner selection, for creating new games
app.post('/o', function(req, res){
    var chosenName = req.body.landingInput;
    // create a new game object
        // make sure it isn't in the existing databases, otherwise retry
    res.redirect('/o');
});

app.get('/o', function (req, res){
    // send them instructions on how to tell other people to join
    res.render('owner');
    // console.log('Redirected to owner page');
})

// player selection
app.post('/p', function(req, res){
    var gameName = converter(req.body.landingInput);
    // see if the gameName is in the database directory
    // if it is, redirect them to the page
    // if it is not, redirect them to the landing page with an error message
    res.redirect('/p');
});

app.get('/p', function (req, res){
    res.render('player');
    // console.log('Redirected to player page');
})


// making connections
http.listen(4000, function(){
    console.log('listening on *:4000');
});
