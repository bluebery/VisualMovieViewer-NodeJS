
var socket;
var sortByTitle = true; // have this as a global so different functions responsible for modifying the movie list know how to display it again
var movieList; // this is a global for now

function InitializeFormContent() {
	
	AssociateClickHandlers();

	socket = io();
	
	// put this in a function call back? does the event happen outside of our request? doubtful
	// take the list of movies in data and display them accordingly
	socket.on('MoviesListUpdated', function(err, data) {
		if (err) { console.log(err) }
		else{ 
			movieList = data;
			DisplayMovies();
		}
	});

	socket.emit('GetMovieList');
}

function AssociateClickHandlers() {
	
	// testing button
	$('#buttonthing').click(function () {
		//socket.emit('GetMovieList');
		//socket.emit('ReadDirectory', 'blackbery', 'movies test' );
		socket.emit('RefreshActiveDatabase', 'blackbery', 'movies 2', false);
	});
	
	$('#SortByTitle').click(function () {
		sortByTitle = true;
		DisplayMovies();
	});
	
	$('#SortByRating').click(function () {
		sortByTitle = false;
		DisplayMovies();
	});
	
	$('#searchButton').click(function () {
		if (document.getElementById("searchBox").value == 'test') {
			socket.emit('GetMovieList');
		}
		else { 
			var x = 0;
		}
	});
}

// temporary function to display rudimentary movie information for debugging 
function DisplayMovies() {
	
	if (sortByTitle) { movieList.sort(SortMovieNameAZ); }
	else { movieList.sort(SortMovieRating1000); }

	document.getElementById("content").innerHTML = ''; // clear our page

	for (var i = 0; i < movieList.length; i++) {
		document.getElementById("content").innerHTML += movieList[i].Name + '<br>' + movieList[i].Description + '<br>' + movieList[i].Rating + '<br>' + movieList[i].ImageUrl + '<br><br>';
		
	// write images test
	/*
		var img = document.createElement('img');
		img.setAttribute('src', movieList[i].ImageUrl);
		img.setAttribute('alt', 'asfd');
		document.getElementById("divcontent").appendChild(img);
	 */
	}
}

SortMovieNameAZ = function (a, b) {
	if (a.Name > b.Name) { return 1; }
	else if (a.Name < b.Name) { return -1; }
	else { return 0; }
}

SortMovieNameZA = function (a, b) {
	if (a.Name < b.Name) { return 1; }
	else if (a.Name > b.Name) { return -1; }
	else { return 0; }
}

SortMovieRating1000 = function (a, b) {
	if (a.Rating < b.Rating) { return 1; }
	else if (a.Rating > b.Rating) { return -1; }
	else { return 0; }
}



