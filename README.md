
TODO Try to enter game, if it does exist, reroute owner/player to it
TODO Try to enter game, if it does not exist, reroute back to '/' with error




TODO Pass the text input on the landing page to the owner and player pages somehow
TODO Create a unique ID code generator to pass as a cookie to the game owner
TODO If someone tries to join a game in progress and they have the cookie code, they become the owner
TODO Player and Owner pages should all have a div that shows "blocks" of submissions
TODO Players should have a submit button to submit their answer to the gameboard
TODO Owners should have a clear button to clear the submissions from the gameboard



from old html socket info ...
<body>
  <ul id="messages"></ul>
  <form action="">
    <input id="m" autocomplete="off" /><button>Send</button>
  </form>
  <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
  <script src="http://code.jquery.com/jquery-1.11.1.js"></script>
  <script>
    var socket = io();
    // var socket = io('/my-namespace');
    $('form').submit(function(){
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
    });
    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg));
    });
  </script>
</body>
