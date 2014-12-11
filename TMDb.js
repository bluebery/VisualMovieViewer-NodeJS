var MovieDB = require('moviedb')('b1b43d0d5de2e1c0298b3f8818e164e1');
module.exports = exports = TMDb;

function TMDb() {

}

TMDb.prototype.GetMovieInformation = function (movie, replyFn) {

	MovieDB.searchMovie({ query: movie.Name }, function (err, res) {
		if (err) { replyFn(err, null); return; }
		
		if (res.results.length > 0) {
			
			MovieDB.movieInfo({ id: res.results[0].id }, function (err, res) {
				if (err) { replyFn(err, null); return; }
				
				//movie.Image = movieInfo.Image;
				movie.Url = "http://www.imdb.com/title/" + res.imdb_id;
				movie.ImageUrl = "http://image.tmdb.org/t/p/w185/" + res.poster_path;
				movie.Description = res.overview;
				movie.Rating = res.vote_average;
				movie.ReleaseDate = res.release_date;
				movie.Genre = res.genres[0].name;
				
				replyFn(null, movie);
			});
		}
		else {
			replyFn("movie " + movie.Name + " not found on tmdb", null);
		}
	});	
}