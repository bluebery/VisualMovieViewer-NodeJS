
module.exports = exports = ServerMain;

function ServerMain() {
	this.count = 0;

	this.databaseInterface = new (require('./databaseinterface.js'))();
}

ServerMain.prototype.HandleEvents = function(socket) {
	
	var self = this; // can use this if we need globals in our instanced servermain (this) object
	
	// Once the client requests the movie list, call our helper function to retrieve it
	socket.on('GetMovieList', function () {
		GetMovieList(self, function (data) {
			socket.emit('MoviesListUpdated', { movieList: data.movieList });
		});
	});	
}

// Helper function to retreive the active movie list from the db 
function GetMovieList(self, replyFn) {
	
	var connectionString = "";
	var activeMovieListTableName = "MoviesActive";
	var customMovieListTableName = "MoviesCustom";
	var db = self.databaseInterface;
	
	var movieList = new Array();

	var connection = db.EstablishConnection(connectionString);
	db.ReadAllMovies(connection, activeMovieListTableName, function (dataActive) {
		db.ReadAllMovies(connection, customMovieListTableName, function (dataCustom) {
			for (var i = 0; i < dataActive.movieList.length; i++) {
				for (var j = 0; j < dataCustom.movieList.length; j++) {
					
					var movieActive = dataActive.movieList[i];
					var movieCustom = dataCustom.movieList[j];

					if (movieActive.Name == movieCustom.Name) {
						console.log(movieActive);
						console.log(movieCustom);
						
						movieCustom.Id = movieActive.Id; // override the ID of the custom to that of the active...  so that the image has the correct filename in CacheImagery..
						movieCustom.OriginalPath = movieActive.OriginalPath; // override the original path since custom does not know this attribute
						
						console.log(movieCustom);
						
						// todo - we continue iterating over things we have pushed to the back ... don't want to do this
						dataActive.movieList.splice(i, 1); // remote item from active array (i being movieActive)
						dataActive.movieList.push(movieCustom); // insert item from custom array
					}
				}
			}

			if (replyFn) { replyFn({ movieList: dataActive.movieList }); }
		});
	});
}