
module.exports = exports = SocketCommunication;

/* Overarching class which handles the initial io connection from a client */
function SocketCommunication(io) {
	io.on('connection', function (socket) {
		
		console.log('a user connected, creating socket object for them');
		
		socket.on('disconnect', function () {
			console.log('user disconnected');
		});
		
		var servermain = new (require('./servermain.js'))(); // imports servermain.js and then calls the constructor on it into a new object
		servermain.ConnectDatabase(function (err) {
			if (err) { console.log('error connecting db'); return; }

			servermain.HandleEvents(socket);
		});
	});
}