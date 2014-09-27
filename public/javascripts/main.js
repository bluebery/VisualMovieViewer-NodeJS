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

	socket.on('MoviesListUpdated', function()
	{

	});

	socket.emit('GetMovieList');
}
