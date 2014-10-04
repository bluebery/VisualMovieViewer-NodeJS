
var filesystem = require('fs');
var movie = require('./movie.js');

module.exports = exports = ServerMain;

function ServerMain() {
	this.count = 0;

	this.databaseInterface = new (require('./databaseinterface.js'))();
}

ServerMain.prototype.HandleEvents = function(socket) {
	
	var self = this; // can use this if we need globals in our instanced servermain (this) object
	
	// Once the client requests the movie list, call our helper function to retrieve it
	socket.on('GetMovieList', function () {
		GetActiveMovieList(self, function (err, data) {
			socket.emit('MoviesListUpdated', err, data);
		});
	});

	socket.on('ReadDirectory', function (server, directory) {
		GetMoviesFromDirectory(self, server, directory, function (err, data) {
			// data now contains the list of movie objects (intialized with name and path)
			// now we check which of these we already have in master and write to active, 
			// & data from imdb to write to active (if not in master)
			// this involves clearing (or appending) to active depending on user selection
		});
	});	
}

// Template for function to retreive movie names from shared directory
// this is actually the first step in creating movie objects to be written to db when a new path is entered
// i.e. we create a movie object with the name and original path and add it to a list
// todo : handle +1 deep directory crawling
function GetMoviesFromDirectory(self, server, directory, replyFn) {
	var movieList = new Array();

	filesystem.readdir('\\\\' + server + '\\' + directory, function (err, files) {
		if (err) { if (replyFn) { replyFn(err, null); } return; }
		
		// Go through all the results and disclude entries beginning with _
		for (var i = 0; i < files.length; i++) {
			if (files[i].charAt(0) != '_') { 
				var newMovie;

				var regex = '(.*?)\\s\\(.*'// match content before '[space](' (NON GREEDY)
				var result = files[i].match(regex);

				if (result == null) { newMovie = new movie(files[i], '\\\\' + server + '\\' + directory + '\\' + files[i]); }
				else { newMovie = new movie(result[1], '\\\\' + server + '\\' + directory + '\\' + files[i]); }

				movieList.push(newMovie);
			}
		}

		if (replyFn) { replyFn(null, movieList); }
	});
}

// Helper function to retreive the active movie list from the db 
function GetActiveMovieList(self, replyFn) {
	
	var connectionString = "";
	var activeMovieListTableName = "MoviesActive";
	var customMovieListTableName = "MoviesCustom";
	var db = self.databaseInterface;

	db.EstablishConnection(connectionString, function (err, connection) {
		if (err) { if (replyFn) { replyFn(err, null); } return; }
		
		db.ReadAllMovies(connection, activeMovieListTableName, function (err, moviesActive) {
			if (err) { if (replyFn) { replyFn(err, null); } return; }
			
			db.ReadAllMovies(connection, customMovieListTableName, function (err, moviesCustom) {
				if (err) { if (replyFn) { replyFn(err, moviesActive); } return; }
				
				for (var i = 0; i < moviesActive.length; i++) {
					for (var j = 0; j < moviesCustom.length; j++) {
						
						var movieActive = moviesActive[i];
						var movieCustom = moviesCustom[j];
						
						if (movieActive.Name == movieCustom.Name) {

							movieCustom.Id = movieActive.Id; // override the ID of the custom to that of the active...  so that the image has the correct filename in CacheImagery..
							movieCustom.OriginalPath = movieActive.OriginalPath; // override the original path since custom does not know this attribute

							moviesActive[i] = movieCustom; // override the entire active movie with the custom one
						}
					}
				}
			
				if (replyFn) { replyFn(null, moviesActive); }
			});
		});
	});
}