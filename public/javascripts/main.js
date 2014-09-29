/*
    $(function () {
        $('.navbar-nav li').click(function () {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
        });
});
*/

var socket;

function InitializeFormContent() {

	socket = io();
	
	$('#buttonthing').click(function () {
		socket.emit('GetMovieList');
	});

	// put this in a function call back? does the event happen outside of our request? doubtful
	// take the list of movies in data and display them accordingly
	socket.on('MoviesListUpdated', function(data)
	{
		console.log(data.movieList);
	});

	socket.emit('GetMovieList');
}


