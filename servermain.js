
module.exports = exports = ServerMain;

function ServerMain() {
	this.count = 0;
}

ServerMain.prototype.HandleEvents = function(socket) {
	
	var self = this;

	socket.on('GetMovieList', function () {
		var movieList = GetMovieList(self);
		//socket.emit('MoviesListUpdated', { movies: movieList });
		socket.emit('MoviesListUpdated', { movies: movieList });
	});	
}

function GetMovieList(self) {
	
	var movieList = new Array();
	
	/*
	if (this.count == 0) {
		movieList[0] = "Lord of the Rings 0";
		movieList[1] = "Star Wars 0";

		this.count++;

		return movieList;
	}
	
	if (this.count == 1) {
		movieList[0] = "Harry Potter 1";
		movieList[1] = "V for Vendetta 1";

		this.count--;

		return movieList;
	}*/

	self.count++;

	return self.count;
}