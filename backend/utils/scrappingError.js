module.exports = class scrappingError extends Error {
	constructor({ message, details: {} } = {}) {
		super(message);
		this.details = details;
	}
};
