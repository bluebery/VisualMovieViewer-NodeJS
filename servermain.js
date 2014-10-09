﻿
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
		});
	});

	socket.on('RefreshActiveDatabase', function (server, directory, overloadDirectories) {
		RefreshActiveDatabase(self, server, directory, overloadDirectories, function (err, data) {

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

function RefreshActiveDatabase(self, server, directory, overloadDirectories, replyFn) {
	
	var connectionString = "";
	var activeMovieListTableName = "MoviesActive";
	var customMovieListTableName = "MoviesCustom";
	var masterMovieListTableName = "MoviesMaster";
	var db = self.databaseInterface;

	GetMoviesFromDirectory(self, server, directory, function (err, movieList) {
		// data now contains the list of movie objects (intialized with name and path)
		// now we check which of these we already have in master and write to active, 
		// & data from imdb to write to active (if not in master)
		// this involves clearing (or appending) to active depending on user selection
		
		// inside here we check whether this is actually required to be cleared - a bit unclear when written like this!
		ClearActiveDatabase(self, overloadDirectories, function (err) {
			if (err) { if (replyFn) { replyFn(err, null); } return; }
			
			// get the list of movies from the master database and copy over to active if the name matches one in our current directory
			// todo: can't we just do a query on movie name?? (lots of individual queries :()
			GetMasterMovieList(self, function (err, moviesMaster) {
				if (err) { if (replyFn) { replyFn(err, null); } return; }

				for (var i = 0; i < movieList.length; i++) {

					var containedInMaster = false;
					// todo: check if we already have this in our active

					for (var j = 0; j < moviesMaster.length; j++) {
						
						var movie = movieList[i];
						var movieFromMaster = moviesMaster[j];

						if (movie.Name == movieFromMaster.Name) {
							containedInMaster = true;

							movie.Image = movieFromMaster.Image;
							movie.Url = movieFromMaster.Url;
							movie.ImageUrl = movieFromMaster.ImageUrl;
							movie.Description = movieFromMaster.Description;
							movie.Rating = movieFromMaster.Rating;
							movie.ReleaseDate = movieFromMaster.ReleaseDate;
							movie.Genre = movieFromMaster.Genre;
							movie.Id = movieFromMaster.Id;

							WriteMovieToActiveDatabase(movie, function (err) {

							});

							break; // break here to stop searching once we have found the movie inside the master db
						}
					}

					if (!containedInMaster) {
						// do something with IDs, and then get information from TMDb and write to active
					}
				}
			});
		});
	});
}

// Async wrapper around overloaddirectories decision; clears active database if false
function ClearActiveDatabase(self, overloadDirectories, replyFn) {
	
	var connectionString = "";
	var activeMovieListTableName = "MoviesActive";
	var customMovieListTableName = "MoviesCustom";
	var db = self.databaseInterface;

	if (!overloadDirectories) {
		db.EstablishConnection(connectionString, function (err, connection) {
			if (err) { if (replyFn) { replyFn(err); } return; }
			
			db.ClearAll(connection, activeMovieListTableName, function (err, data) {
				if (err) { if (replyFn) { replyFn(err); } return; }
				if (replyFn) { replyFn(null); }
			});
		});
	}
	else { if (replyFn) { replyFn(null); } }
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

// Helper function to retreive the active movie list from the db 
function GetMasterMovieList(self, replyFn) {
	
	var connectionString = "";
	var masterMovieListTableName = "MoviesMaster";
	var db = self.databaseInterface;
	
	db.EstablishConnection(connectionString, function (err, connection) {
		if (err) { if (replyFn) { replyFn(err, null); } return; }
		
		db.ReadAllMovies(connection, masterMovieListTableName, function (err, moviesMaster) {
			if (err) { if (replyFn) { replyFn(err, null); } return; }
			
			if (replyFn) { replyFn(null, moviesMaster); }
		});
	});
}

// todo implement
function WriteMovieToActiveDatabase(self, replyFn) {

}