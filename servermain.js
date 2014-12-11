
var filesystem = require('fs');
var movie = require('./movie.js');
var TMDb = require('./TMDb.js');

module.exports = exports = ServerMain;

function ServerMain() {
	this.count = 0;

	this.databaseInterface = new (require('./databaseinterface.js'))();
}

ServerMain.prototype.ConnectDatabase = function (replyFn) {
	this.databaseInterface.EstablishConnection('', function (err) {
		replyFn(null);
	});
}

ServerMain.prototype.HandleEvents = function(socket) {
	
	var self = this; // can use this if we need globals in our instanced servermain (this) object
	
	// Once the client requests the movie list, call our helper function to retrieve it
	socket.on('GetMovieList', function () {
		GetActiveMovieList(self, function (err, data) {
			socket.emit('MoviesListUpdated', err, data);
		});
	});
	
	// don't really need this, it's part of RefreshActiveDatabase
	socket.on('ReadDirectory', function (server, directory) {
		GetMoviesFromDirectory(self, server, directory, function (err, data) {
			// data now contains the list of movie objects (intialized with name and path)
		});
	});

	socket.on('RefreshActiveDatabase', function (server, directory, overloadDirectories) {
		RefreshActiveDatabase(self, server, directory, overloadDirectories, function (err) {

		});
	});
}

// Template for function to retreive movie names from shared directory
// this is actually the first step in creating movie objects to be written to db when a new path is entered
// i.e. we create a movie object with the name and original path and add it to a list
// todo : handle +1 deep directory crawling
function GetMoviesFromDirectory(self, server, rootDirectory, replyFn) {
	var movieList = new Array();
	
	var directories = getDirectories('\\\\' + server + '\\' + rootDirectory);
	
	for (var i = 0; i < directories.length; i++) {
		var subdirectories = getDirectories('\\\\' + server + '\\' + rootDirectory + '\\' + directories[i]);
		var subMovieFound = false;
		
		// a whole set of 2nd level directories
			for (var j = 0; j < subdirectories.length; j++) {
				if (CreateMovieObjectFromDirectory(server, rootDirectory + '\\' + directories[i], subdirectories[j], movieList)) {
					subMovieFound = true;
				} 
			}
		
		if (!subMovieFound) {
			CreateMovieObjectFromDirectory(server, rootDirectory, directories[i], movieList); // just one top level directory
		}
	}
	
	console.log(movieList);

	if (replyFn) { replyFn(null, movieList); }

/*
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
	});*/
}

function CreateMovieObjectFromDirectory(server, rootDirectory, directory, movieList) {
	if (directory.charAt(0) != '_') {
		var newMovie;
		
		var regex = '(.*?)\\s\\(.*'// match content before '[space](' (NON GREEDY)
		var result = directory.match(regex);
		
		if (result == null) { newMovie = new movie(directory, '\\\\' + server + '\\' + rootDirectory + '\\' + directory); }
		else { newMovie = new movie(result[1], '\\\\' + server + '\\' + rootDirectory + '\\' + directory); }
		
		movieList.push(newMovie);
		
		return true;
	}
	else { return false; }
}

function getDirectories(path) {
	return filesystem.readdirSync(path).filter(function (file) {
		return filesystem.statSync(path + '/' + file).isDirectory();
	});
}

function RefreshActiveDatabase(self, server, directory, overloadDirectories, replyFn) {
	
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
			if (err) { replyFn(err); return; }
			
			// get the list of movies from the master database and copy over to active if the name matches one in our current directory
			// todo: can't we just do a query on movie name?? (lots of individual queries :()
			GetMasterMovieList(self, function (err, moviesMaster) {
				if (err) { replyFn(err); return; }

				for (var i = 0; i < movieList.length; i++) {

					var containedInMaster = false;
					var masterUniqueId = 0;
					var movie = movieList[i];
					// todo: check if we already have this in our active

					for (var j = 0; j < moviesMaster.length; j++) {
						
						
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

							WriteMovieToActiveDatabase(self, movie, function (err) {
								if (err) { replyFn(err); return; }
							});

							break; // break here to stop searching once we have found the movie inside the master db
						}
					}

					if (!containedInMaster) {
						// have to create a new instance of TMDb helper class so that the variable movie
						// doesn't get stomped as this containing for loop goes around and around without
						// waiting for the async json calls to return
						var tmdb = new TMDb();

						tmdb.GetMovieInformation(movie, function (err, movie) {
							if (err) { console.log(err); }
							else {
								WriteMovieToActiveDatabase(self, movie, function (err) {
									if (err) { console.log(err); }
								});
								
								WriteMovieToMasterDatabase(self, movie, function (err) {
									if (err) { console.log(err); }
								});					
							} 
						});
					}
				}
			});
		});
	});
}

// Async wrapper around overloaddirectories decision; clears active database if false
function ClearActiveDatabase(self, overloadDirectories, replyFn) {
	
	var activeMovieListTableName = "MoviesActive";
	var db = self.databaseInterface;

	if (!overloadDirectories) {
		db.ClearAll(activeMovieListTableName, function (err, data) {
			if (err) { replyFn(err); return; }
			replyFn(null);
		});
	}
	else { replyFn(null); }
}

// Helper function to retreive the active movie list from the db 
function GetActiveMovieList(self, replyFn) {
	
	var activeMovieListTableName = "MoviesActive";
	var customMovieListTableName = "MoviesCustom";
	var db = self.databaseInterface;
		
	db.ReadAllMovies(activeMovieListTableName, function (err, moviesActive) {
		if (err) { replyFn(err, null); return; }
			
		db.ReadAllMovies(customMovieListTableName, function (err, moviesCustom) {
			if (err) { replyFn(err, moviesActive); return; }
				
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
			
			replyFn(null, moviesActive);
		});
	});
}

// Helper function to retreive the active movie list from the db 
function GetMasterMovieList(self, replyFn) {
	var masterMovieListTableName = "MoviesMaster";
	var db = self.databaseInterface;

	db.ReadAllMovies(masterMovieListTableName, function (err, moviesMaster) {
		if (err) { replyFn(err, null); return; }
		replyFn(null, moviesMaster);
	});
}

function WriteMovieToActiveDatabase(self, movie, replyFn) {
	var activeMovieListTableName = "MoviesActive";
	var db = self.databaseInterface;
	
	db.WriteMovie(activeMovieListTableName, movie, function (err) {
		if (err) { replyFn(err); return; }
		replyFn(null);
	});
}

function WriteMovieToMasterDatabase(self, movie, replyFn) {
	var masterMovieListTableName = "MoviesMaster";
	var db = self.databaseInterface;
	
	db.WriteMovie(masterMovieListTableName, movie, function (err) {
		if (err) { replyFn(err); return; }
		replyFn(null);
	});
}