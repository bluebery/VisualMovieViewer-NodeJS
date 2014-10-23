describe('db movie operations', function () {

	var activeMovieListTableName = "MoviesActive";
	
	it('should connect to db', function (done) {
		var db = new (require('./../databaseinterface.js'))();
		db.EstablishConnection('', function (err) {
			expect(err).toBe(null);
			expect(db.connection).not.toBe(null);
			
			/*
			db.ReadAllMovies(activeMovieListTableName, function (err, MoviesActive) {
				console.log('something3');
				expect(err).toBe(null);
				expect(moviesActive.length).toBeGreaterThan(0);
				expect(moviesActive[0].Name).not.toBe(null);
			});
			*/ 
			 
			db.connection.close();
			done();
		});
	});
	
	/*

	it('shows asynchronous test', function () {
		setTimeout(function () {
			expect('second').toEqual('second');
			asyncSpecDone();
		}, 1);
		expect('first').toEqual('first');
		asyncSpecWait();
	});
	*/
	/*
	it('shows asynchronous test node-style', function (done) {
		setTimeout(function () {
			expect('second').toEqual('second');
			// If you call done() with an argument, it will fail the spec 
			// so you can use it as a handler for many async node calls
			done();
		}, 1);
		expect('first').toEqual('first');
	});
	*/
});