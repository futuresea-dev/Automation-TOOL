const path = require('path');
const fs = require('fs');
const Task = require('./../models/task');
const taskManager = require('./taskManager');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const MultiloginAPI = require('./../../MultiloginAPI');
const consts = require('./../../consts');
const proxyManager = require('./../../proxyManager');
const mAPI = new MultiloginAPI(consts.multilogin.port);
const _ = require('lodash');

exports.createScrapingTask = catchAsync(
	async (req, res, next) => {
		let {
			license,
			/*  firstname, lastname,  */ email,
			password,
			mileage,
			price,
			zip,
			city,
			phone,
			state,
			images: ExistingImages,
			description,
			color,
		} = req.body;

		ExistingImages = Array.isArray(ExistingImages) ? ExistingImages : typeof ExistingImages === 'string' ? [ExistingImages] : [];

		// for (const image of ExistingImages)
		// 	if (!fs.existsSync(path.join(__dirname, "./../images", image)))
		// 		return next(
		// 			new AppError(
		// 				`image ${image} doesn't exit (maybe the coresponding task was deleted!)`,
		// 				400
		// 			)
		// 		);

		const images = [...ExistingImages, ...req.files.map((x) => x.filename)];

		// creating multilogin profile
		// const proxy = `lum-customer-c_7b9520dc-zone-isp-route_err-block-country-nl-session-${
		// 	(1000000 * Math.random()) | 0
		// }:fu5du2o7h2ll@zproxy.lum-superproxy.io:22225`;

		const { uuid: profileId, message: mError } = await mAPI.create({
			proxy: `127.0.0.1:24000`,
			// proxy: `user-mkey100-sessionduration-10:mkey100@nl.smartproxy.com:${_.random(
			// 	10001,
			// 	10100
			// )}`,
		});

		if (!profileId) throw new Error(`Error while creating multilogin profile: ${mError}`);

		console.log(`creating task (license: ${license})`);
		const task = await Task.create({
			license,
			// firstname,
			// lastname,
			email,
			password,
			mileage,
			price,
			zip,
			city,
			phone,
			state,
			images,
			description: (description || '').trim(),
			color,
			profileId,
		});

		taskManager.add(task);

		res.json({
			status: 1,
			data: task,
		});
	},
	(req) => {
		const files = req.files;
		for (const file of files) {
			try {
				fs.unlinkSync(file.path);
			} catch (error) {}
		}
	}
);

exports.getScrapingTasks = catchAsync(async (req, res, next) => {
	let { limit = 20, page = 1 } = req.query;
	page = Math.round(Number(page));
	limit = Math.round(Number(limit)) || 25;
	if (page < 1) page = 1;

	const tasks = await Task.find()
		.sort('-date')
		.skip(limit * (page - 1))
		.limit(limit * 1);

	res.json({
		status: 1,
		data: tasks,
	});
});

exports.getScrapingTask = catchAsync(async (req, res, next) => {
	const task = await Task.findById(req.params.id);
	res.json({
		status: 1,
		data: task,
	});
});

exports.deleteScrapingTask = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const task = await Task.findById(id);

	if (task.state === 'running') return next(new AppError("Can't delete a running task!", 400));

	await Task.findByIdAndDelete(id);

	await mAPI.delete(task.profileId);
	// await proxyManager.delete(task.proxy * 1);

	for (const file of task.images) {
		try {
			fs.unlinkSync(path.join(__dirname, './../images', file));
		} catch (error) {}
	}

	res.json({ status: 1 });
});

exports.restartScrapingTask = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const task = await Task.findById(id);

	if (!task.state.match(/crashed|finished/)) return next(new AppError("Task's state isn't equal to crashed or finished, Can't restart", 400));

	await Task.findByIdAndUpdate(id, { state: 'pending' });
	task.state = 'pending';

	taskManager.add(task);

	res.json({ status: 1 });
});
