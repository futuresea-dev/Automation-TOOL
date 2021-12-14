const path = require("path");
const fs = require("fs");
const Task = require("./../models/task");
const _ = require("./../../utils");
const chalk = require("chalk");
const thize = require("thize");
const { postCar } = require("../../post");

const manager = {
	queue: [],

	add(task) {
		task = JSON.parse(JSON.stringify(task));
		const existingTask = this.queue.find((el) => el._id === task._id);
		if (existingTask) {
			Object.assign(existingTask, task);
		} else this.queue.push(task);
	},

	get(_id) {
		return this.queue.find((el) => el._id === String(_id));
	},

	async updateDatabase({ task, id }) {
		if (!task) {
			if (!id) throw new Error(`task or id are required to update the databse`);
			task = this.queue.find((el) => el._id === task._id);
		}

		await Task.findByIdAndUpdate(task._id, task, { omitUndefined: true });
	},

	async markInputFileDone({ fileId, task }) {
		fileId = fileId || task.input;
		await google.updateFile({ fileId, name: `${task.inputFileName}_done.csv` });
	},
	async process(task) {
		const identifier = `(id: ${task._id})`;
		console.log(chalk.blue("Processing task"), chalk.gray(identifier));
		task.state = "running";

		// reseting
		task.error = "";
		task.carLink = "";

		await this.updateDatabase({ task });
		const result = await postCar(task);

		if (typeof result === "string") {
			task.state = "finished";
			task.carLink = result;
		} else if (result instanceof Error) {
			task.state = "crashed";
			task.error = result;
		} else {
			throw new Error(`unknown result (${result})`);
		}

		console.log(
			chalk[task.state === "crashed" ? "redBright" : "greenBright"](
				`Task ${task.state}, Result:`,
				task.carLink || task.error
			),
			chalk.gray(`(id: ${task._id})`)
		);

		await this.updateDatabase({ task });
	},

	async addAll() {
		const tasks = await Task.find();
		tasks.forEach(this.add.bind(this));
	},

	async run() {
		await Task.updateMany(
			{ state: "running" },
			{
				state: "pending",
			}
		);

		await this.addAll();

		while (true) {
			const task = this.queue.find((el) => el.state === "pending");
			const runningOrPausedTasks = this.queue.filter(({ state }) =>
				state.match(/^(running)$/)
			);

			if (task && runningOrPausedTasks.length < 1) this.process(task);
			await _.wait(1);
		}
	},
};

module.exports = manager;
