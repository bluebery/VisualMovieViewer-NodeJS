
module.exports = exports = ServerMain;

function ServerMain() {
	this.count = 0;

	this.databaseInterface = new (require('./databaseinterface.js'))();
}

ServerMain.prototype.HandleEvents = function(socket) {
	
	var self = this; // can use this if we need globals in our instanced servermain (this) object

	socket.on('GetMovieList', function () {
		var movieList = GetMovieList(self);
		socket.emit('MoviesListUpdated', { movies: movieList });
	});	
}

function GetMovieList(self) {
	
	var connectionString = "";
	var activeMovieListTableName = "MoviesActive";
	var db = self.databaseInterface;

	db.EstablishConnection(connectionString);
	var movieList = db.ReadAllMovies(activeMovieListTableName);

	return movieList;
}