
module.exports = exports = ServerMain;

function ServerMain() {
	this.count = 0;

	this.databaseInterface = new (require('./databaseinterface.js'))();
}

ServerMain.prototype.HandleEvents = function(socket) {
	
	var self = this; // can use this if we need globals in our instanced servermain (this) object
	
	// Once the client requests the movie list, call our helper function to retrieve it
	socket.on('GetMovieList', function () {
		GetMovieList(self, function (err, data) {
			socket.emit('MoviesListUpdated', err, data);
		});
	});	
}

// Helper function to retreive the active movie list from the db 
function GetMovieList(self, replyFn) {
	
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
							console.log(movieActive);
							console.log(movieCustom);
							
							movieCustom.Id = movieActive.Id; // override the ID of the custom to that of the active...  so that the image has the correct filename in CacheImagery..
							movieCustom.OriginalPath = movieActive.OriginalPath; // override the original path since custom does not know this attribute
							
							console.log(movieCustom);
							
							moviesActive[i] = movieCustom; // override the entire active movie with the custom one
						}
					}
				}
			
				if (replyFn) { replyFn(null, moviesActive); }
			});
		});
	});
}