module.exports = (fn, cb) => {
	return (req, res, next) => {
		fn(req, res, next).catch((err) => {
			if (cb) cb(req);
			next(err);
		});
	};
};
