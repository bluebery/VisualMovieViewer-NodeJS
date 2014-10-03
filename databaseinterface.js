
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

// Does not read [ImageData] for performance reasons
DatabaseInterface.prototype.ReadAllMovies = function (connection, databaseTable, replyFn) {
		
	var request = new sql.Request(connection); // or: var request = connection.request();
	
	request.query('select [Id], [Name], [Url], [ImageUrl], [OriginalPath], [Description], [Rating], [ReleaseDate], [Genre] from ' + databaseTable, function (err, recordset) {
	//request.query('select * from ' + databaseTable, function (err, recordset) {
		if (err) { if (replyFn) { replyFn(err, null); } return; }
		if (replyFn) { replyFn(null, recordset); }
	});
}