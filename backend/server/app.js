const express = require("express");
const path = require("path");
const cors = require("cors");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

// Importing Routers
const taskRouter = require("./routers/taskRouter");

app.use(express.static(path.join(__dirname, "./../public")));
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);

// Using Routers
app.use("/api/task", taskRouter);

// Error Handling
app.all("*", (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
