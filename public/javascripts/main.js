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
	
	// put this in a function call back? does the event happen outside of our request? doubtful
	
	$('#buttonthing').click(function () {
		socket.emit('GetMovieList');
	});

	socket.on('MoviesListUpdated', function(data)
	{
		console.log(data.counter);
	});

	socket.emit('GetMovieList');
}


