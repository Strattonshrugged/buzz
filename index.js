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
    var id = converter(req.body.landingInput);
    if (option == 'player')   {
        var idCheck = isValidGame(id);
        if (idCheck == false)    {
            res.render('landing', {'error' : 'Oh no! Cannot locate game'});
        }   else {
            res.redirect('/g/' + id);
        }
    }   else if (option == 'owner') { // here meaning radio button set to create new game not join existing one
        var newID = createID();
        var randomKey = Math.floor((Math.random() * 10000));
        var game = new Game();
        game.spokenID = newID;
        game.gameID = converter(newID);
        game.ownerCookie = randomKey;
        game.givenName = req.body.landingInput;
        game.joinUrl = req.get('host') + req.path + '/' + converter(newID);

        database.push(game);

        // make new namespace for game
        var nsp = io.of('/' + game.gameID);
        nsp.on('connection', function(socket){
            console.log('Connection detected');
            socket.on('chat message', function(msg){
                console.log('Socket is being called, message received');
                nsp.emit('chat message', msg);
            });
        });
        // TODO save off namespace by gameID?

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

    var gameObject = fetchObject(database);

    if (req.cookies.gamebuzzer == gameObject.ownerCookie)  {
        // console.log('Owner template to be served!');
        res.render('owner', {'givenName' : gameObject.givenName,'spokenID' : gameObject.spokenID, 'gameID' : gameID});
    }   else  {
        // console.log('Player template to be served!');
        res.render('player', {'givenName' : gameObject.givenName,'spokenID' : gameObject.spokenID, 'gameID' : gameID});
    }
}) // end of app.get

// listening for connections

http.listen(4000, function(){
    console.log('listening on *:4000');
});

// testing and experimentation
var testbase = {
    '007' : {'fname' : 'James','lname' : 'Bond','nation' : 'British'},
    'Damon' : {'fname' : 'Jason','lname' : 'Bourne','nation' : 'American'},
    'PinkPanther' : {'fname' : 'Inspector','lname' : 'Clousseau','nation' : 'French'}
}
// I like that ... now how the hell do I insert that into a database ...
var condorFile = {'fname' : 'Jackie','lname' : 'Chan','nation' : 'China'}
console.log('condorFile is : ' + JSON.stringify(condorFile))
testbase.Condor = condorFile;
console.log('testbase.Condor : ' + JSON.stringify(testbase.Condor));
console.log('testbase.Condor.nation : ' + testbase.Condor.nation);


// console.log('Whole testbase : ' + JSON.stringify(testbase))
// console.log('testbase.Damon.fname : ' + testbase.Damon.fname)
// console.log('testbase.PinkPanther.nation : ' + testbase.PinkPanther.nation)
