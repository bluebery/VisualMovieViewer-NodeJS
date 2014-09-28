
module.exports = exports = DatabaseInterface;

// empty
function DatabaseInterface() {

}

DatabaseInterface.prototype.EstablishConnection = function (connectionString) {

}

DatabaseInterface.prototype.ReadAllMovies = function (databaseTable) {
	var movieList = new Array();
	movieList[0] = "Lord of the Rings";
	movieList[1] = "Harry Potter";

	return movieList;
}