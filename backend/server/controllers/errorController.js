const chalk = require("chalk");
const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}.`;
	return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
	const [key, value] = Object.entries(err.keyValue)[0];
	const message = `Duplicate field value (${key}: ${value})`;
	return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
	const errors = Object.values(err.errors).map((el) => el.message);

	const message = `Invalid input data. ${errors.join(". ")}`;
	return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
	if (req.originalUrl.startsWith("/api")) {
		return res.status(err.statusCode).json({
			status: err.status,
			error: err,
			message: err.message,
			stack: err.stack,
		});
	}
};

const sendErrorProd = (err, req, res) => {
	// A) API
	if (req.originalUrl.startsWith("/api")) {
		if (err.isOperational) {
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
			});
		}

		return res.status(500).json({
			status: err.status,
			message: "Something went wrong!",
		});
	}
};

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = 0;

	if (process.env.NODE_ENV === "production") {
		err.message = err.message;

		if (err.name === "CastError") err = handleCastErrorDB(err);
		if (err.code === 11000) err = handleDuplicateFieldsDB(err);
		if (err.name === "ValidationError") err = handleValidationErrorDB(err);

		sendErrorProd(err, req, res);
	} else {
		sendErrorDev(err, req, res);
	}

	// mLog([chalk.yellow("API  Error: "), err]);
};
