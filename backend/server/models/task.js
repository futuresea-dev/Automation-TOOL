const mongoose = require('mongoose');

const defaultStr = {
	type: String,
	required: true,
};

const defaultNum = {
	type: Number,
	required: true,
};
const schema = new mongoose.Schema({
	license: { type: String },
	// firstname: defaultStr,
	// lastname: defaultStr,
	email: defaultStr,
	password: defaultStr,
	mileage: defaultNum,
	price: defaultNum,
	zip: defaultStr,
	city: defaultStr,
	phone: defaultStr,
	images: {
		type: [String],
		default: [],
	},
	description: defaultStr,
	color: { type: Number, required: false },
	state: {
		type: String,
		enum: ['pending', 'running', 'finished', 'crashed'],
		default: 'pending',
	},
	error: {
		type: String,
	},
	carLink: {
		type: String,
	},
	date: {
		type: Date,
		default: Date.now(),
	},
	profileId: defaultStr,
});

module.exports = mongoose.model('Task', schema);
