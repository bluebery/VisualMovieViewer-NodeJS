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
	socket.on('MoviesListUpdated', function(err, data) {
		if (err) { console.log(err) }
		else {
			console.log(data);
			for (var i = 0; i < data.length; i++) {
				document.getElementById("content").innerHTML += data[i].Name + '<br>';
			}
		}
	});

	socket.emit('GetMovieList');
}


