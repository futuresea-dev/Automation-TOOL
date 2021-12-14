const path = require("path");
const app = require("./server/app");
const mongoose = require("mongoose");
const taskManager = require("./server/controllers/taskManager");
const _ = require("./utils");

// Dev
const dotenv = require("dotenv");
const morgan = require("morgan");
dotenv.config({ path: path.join(__dirname, "./server/config.env") });
app.use(morgan("dev"));

process.on("uncaughtException", (err) => mLog(err));
process.on("unhandledRejection", (err) => mLog(err));

(async function () {
	// Connecting to DB
	const DB = process.env.DATABASE;

	try {
		mLog("Connecting to DB...");
		await mongoose.connect(DB, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
		});
	} catch (error) {
		error.message = `Failed to connect to DB! Message: ${error.message}"`;
		mLog(error);
	}

	const port = process.env.PORT || 8080;
	app.listen(port, async () => {
		mLog(`Server running on port: ${port}`);

		taskManager.run();
	});
})();
