
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
	
	this.connection = new sql.Connection(config, function (err) {
		if (err) { replyFn(err); return; }
		replyFn(null);
	});

	// https://github.com/patriksimek/node-mssql
}

// Does not read [ImageData] for performance reasons
DatabaseInterface.prototype.ReadAllMovies = function (databaseTable, replyFn) {
		
	var request = new sql.Request(this.connection); // or: var request = connection.request();
	
	request.query('select [Id], [Name], [Url], [ImageUrl], [OriginalPath], [Description], [Rating], [ReleaseDate], [Genre] from ' + databaseTable, function (err, recordset) {
	//request.query('select * from ' + databaseTable, function (err, recordset) {
		if (err) { replyFn(err, null); return; }
		replyFn(null, recordset);
	});
}

DatabaseInterface.prototype.ClearAll = function (databaseTable, replyFn) {
	var request = new sql.Request(this.connection); // or: var request = connection.request();
	
	request.query('delete from ' + databaseTable, function (err, recordset) {
		if (err) { replyFn(err, null); return; }
		replyFn(null, recordset);
	});
}

DatabaseInterface.prototype.WriteMovie = function (databaseTable, movie, replyFn) {
	
	var transaction = new sql.Transaction(this.connection);

	transaction.begin(function (err) {
		var request = new sql.Request(transaction); // or: var request = connection.request();

		request.input('Name', sql.VarChar, movie.Name);
		request.input('ImageData', sql.VarChar, 'asfd');
		request.input('Url', sql.VarChar, movie.Url);
		request.input('ImageUrl', sql.VarChar, movie.ImageUrl);
		request.input('OriginalPath', sql.VarChar, movie.Path);
		request.input('Description', sql.VarChar, movie.Description);
		request.input('Rating', sql.VarChar, movie.Rating);
		request.input('ReleaseDate', sql.VarChar, movie.ReleaseDate);
		request.input('Genre', sql.VarChar, movie.Genre);
		request.input('Id', sql.Int, movie.Id);

		var stringquery = 'insert into ' + databaseTable + ' (Name, ImageData, Url, ImageUrl, OriginalPath, Description, Rating, ReleaseDate, Genre, Id)' + ' values(@Name, @ImageData, @Url, @ImageUrl, @OriginalPath, @Description, @Rating, @ReleaseDate, @Genre, @Id)';

		request.query(stringquery, function (err, recordset) {
			if (err) { replyFn(err, null); return; }

			transaction.commit(function (err, recordset) {
				if (err) { replyFn(err, null); return; }
				replyFn(null, recordset);
			});
		});
	});
}