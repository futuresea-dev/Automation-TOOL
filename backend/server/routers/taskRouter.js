const path = require("path");
const express = require("express");
const router = express.Router();
const taskCont = require("./../controllers/taskController");
const multer = require("multer");
const mime2ext = require("mime2ext");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, "../images"));
	},
	filename: function (req, file, cb) {
		let ext = mime2ext(file.mimetype);
		if (!ext) throw new Error(`Can't find extentsion for ${file.originalname}, ${file.mimetype}`);
		const filename = `${Date.now() + "-" + Math.round(Math.random() * 1e9)}.${ext}`;
		cb(null, filename);
	},
});

const upload = multer({ storage });

router.post("/", upload.array("images"), taskCont.createScrapingTask);
router.get("/", taskCont.getScrapingTasks);
router.delete("/:id", taskCont.deleteScrapingTask);
router.get("/restart/:id", taskCont.restartScrapingTask);

module.exports = router;
