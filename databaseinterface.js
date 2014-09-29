
module.exports = exports = DatabaseInterface;
var sql = require('mssql');

// empty
function DatabaseInterface() {

}

DatabaseInterface.prototype.EstablishConnection = function (connectionString, replyFn) {
	
	var config = {
		user: 'movieviewer',
		password: 'movieviewer',
		server: 'arkady2', // You can use 'localhost\\instance' to connect to named instance
		database: 'VisualMovieViewer',
		
		options: {
			encrypt: true // Use this if you're on Windows Azure
		}
	}
	
	var connection = new sql.Connection(config, function (err) {
		if (err) { if (replyFn) { replyFn(err, null); } return; }
		if (replyFn) { replyFn(null, connection); }
	});

	// https://github.com/patriksimek/node-mssql
}

DatabaseInterface.prototype.ReadAllMovies = function (connection, databaseTable, replyFn) {
		
	var request = new sql.Request(connection); // or: var request = connection.request();

	request.query('select * from ' + databaseTable, function (err, recordset) {
		if (err) { if (replyFn) { replyFn(err, null); } return; }
		if (replyFn) { replyFn(null, recordset); }
	});
}