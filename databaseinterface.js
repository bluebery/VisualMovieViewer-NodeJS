
module.exports = exports = DatabaseInterface;
var sql = require('mssql');

// empty
function DatabaseInterface() {

}

DatabaseInterface.prototype.EstablishConnection = function (connectionString) {
	
	var config = {
		user: 'movieviewer',
		password: 'movieviewer',
		server: 'arkady2', // You can use 'localhost\\instance' to connect to named instance
		database: 'VisualMovieViewer',
		
		options: {
			encrypt: true // Use this if you're on Windows Azure
		}
	}
	
	return config;

	// https://github.com/patriksimek/node-mssql
}

DatabaseInterface.prototype.ReadAllMovies = function (config, databaseTable, replyFn) {
	var connection = new sql.Connection(config, function (err) {
		// ... error checks
		
		// Query
		
		var request = new sql.Request(connection); // or: var request = connection.request();

		request.query('select * from ' + databaseTable, function (err, recordset) {
			// ... error checks
			
			if (replyFn) { replyFn({ movieList: recordset }); }
		});

	});
}