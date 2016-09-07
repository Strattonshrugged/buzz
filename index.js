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

// templating and serving
app.use('/static', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/templates');


// first contact!
app.get('/', function(req, res){
  res.render('landing');
});

// incoming get request as owner
app.post('/o', function(req, res){
  res.render('owner');
});

// incoming get request as player
app.post('/p', function(req, res){
  res.render('player');
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});
