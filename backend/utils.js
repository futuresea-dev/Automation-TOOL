const path = require('path');
const chalk = require('chalk');
const stripAnsi = require('strip-ansi'); // Used to remove the styles applied by chalk
const fs = require('fs');
const axios = require('axios').default;
const mime2ext = require('mime2ext');
const { v4: uuid } = require('uuid');
function createPath(dir) {
	dir = path.parse(dir).dir.replace(/\\\\/g, '/');
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, {
			recursive: true,
		});
	}
}

exports.createPath = createPath;

// Making sure we can save the errors with stack and any other added props
Object.defineProperty(Error.prototype, 'toJSON', {
	value: function () {
		var alt = {};

		Object.getOwnPropertyNames(this).forEach(function (key) {
			alt[key] = this[key];
		}, this);

		return alt;
	},
	configurable: true,
	writable: true,
});

const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key, value) => {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return;
			}
			seen.add(value);
		}
		return value;
	};
};

class Logger {
	constructor({
		prefix = '',
		suffix = '',
		logFiles = [
			/* path.join(process.cwd(), "./logs/log.txt") */
		],
	} = {}) {
		this.prefix = prefix;
		this.suffix = suffix;

		if (!Array.isArray(logFiles)) logFiles = [logFiles];
		this.logFiles = logFiles;
	}

	_joinStrs(strs) {
		const cache = [];
		strs = strs
			.map((el) => {
				return typeof el === 'object' ? `\n${JSON.stringify(el, getCircularReplacer(), 2)}\n` : String(el);
			})
			.join(' ');

		return chalk.gray(`${new Date().toLocaleTimeString()}: `) + [this.prefix, strs, this.suffix].join(' ');
	}

	log(strs) {
		strs = this._joinStrs(Array.isArray(strs) ? strs : [strs]);
		console.log(strs);
		for (const dir of this.logFiles) {
			createPath(dir);
			fs.appendFileSync(dir, stripAnsi(strs) + '\n', 'utf8');
		}
	}

	bindLog() {
		return this.log.bind(this);
	}
}

exports.Logger = Logger;
global.mLog = new Logger().bindLog();

// Takes in a base url and query params then generate the final url
exports.URL = function URL(base = '', query = {}) {
	this.base = base;
	this.query = query;

	for (const key in this.query) {
		if (typeof this.query[key] !== 'number' && !this.query[key]) delete this.query[key];
	}

	this.stringify = function () {
		return (
			this.base.split('?')[0] +
			'?' +
			Object.keys(this.query)
				.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(this.query[key])}`)
				.join('&')
		);
	};
};

exports.hostFromUrl = (url) => url.match(/^http(?:s)?:\/\/(?:www\.)?(:?[^\/\?]+)/)?.[1];

exports.wait = function (timeout) {
	if (!timeout) return;
	return new Promise((resolve) => setTimeout(resolve, timeout * 1000));
};

exports.randomStr = (length = 8, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') => {
	let result = '';
	for (let i = length; i > 0; i -= 1) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
};

async function downloadImage(url, folderPath) {
	const response = await axios({
		method: 'GET',
		url,
		responseType: 'stream',
	});
	return await new Promise((resolve, reject) => {
		const ext = mime2ext(response.headers['content-type']);
		const filePath = path.resolve(__dirname, `${uuid()}.${ext}`);

		response.data
			.pipe(fs.createWriteStream(filePath))
			.on('error', reject)
			.once('close', () => resolve(filePath));
	});
}

exports.getCircularReplacer = getCircularReplacer;
exports.downloadImage = downloadImage;
