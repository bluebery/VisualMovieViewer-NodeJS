
/*
 * GET movie pages.
 */

exports.modifymovielanding = function (req, res) {
	res.render('modifymovielanding', { title: 'Modify Movie' });
};

exports.removemovie = function (req, res) {
	res.render('removemovie', { title: 'Remove Movie' });
};