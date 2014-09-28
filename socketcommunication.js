
module.exports = exports = SocketCommunication;

/* Overarching class which handles the initial io connection from a client */
function SocketCommunication(io) {
	io.on('connection', function (socket) {
		
		console.log('a user connected, creating socket object for them');
		
		new ClientSocketCommunication(socket);
	});
}

/* Main class for handling incoming and outgoing socket communication with a particular client, once connected  */
function ClientSocketCommunication(socket) {
	
	this.count = 0;
	var self = this;

	socket.on('GetMovieList', function () {
		socket.emit('MoviesListUpdated', { counter: self.count });
		self.count++;
	});
	
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
}