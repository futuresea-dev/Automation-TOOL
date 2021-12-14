const got = require("got").default;
const { URL } = require("url");
const uuid = require("uuid");

function formatMultiloginError(error) {
	if (error.name === "HTTPError" && error?.response?.body?.message)
		error.message = error.response.body.message + ` [${error.message}]`;

	error.stack = new Error().stack;

	return error;
}
module.exports = class MultiloginAPI {
	constructor(port) {
		this.port = port;
		this.v1 = `http://localhost:${port}/api/v1`;
		this.v2 = `http://localhost:${port}/api/v2`;
	}

	async create({ name = Date.now(), proxy }) {
		try {
			const body = {
				name,
				os: "win",
				browser: "mimic",
				navigator: {
					language: "nl-NL,en-US;q=0.9,en;q=0.8",
					resolution: "1920x1080",
				},
				plugins: {
					enableVulnerable: true,
					enableFlash: true,
				},
				canvas: {
					mode: "NOISE",
				},
			};

			if (proxy) {
				let { host, username, password } = new URL(`http://${proxy}`);
				Object.assign(body, {
					network: {
						proxy: {
							type: "HTTP",
							host: host.split(":")[0],
							port: host.split(":")[1],
							username,
							password,
						},
					},
				});
			}

			const response = await got.post(`${this.v2}/profile`, {
				json: body,
				resolveBodyOnly: true,
				responseType: "json",
			});

			return response;
		} catch (error) {
			console.log(error);
		}
	}

	async delete(id) {
		try {
			// TODO: stop if running
			const response = await got.delete(`${this.v2}/profile/${id}`);
			return response;
		} catch (error) {
			console.log(error);
		}
	}

	async start(id) {
		try {
			return await got.get(
				`${this.v1}/profile/start?automation=true&puppeteer=true&profileId=${id}`,
				{ responseType: "json", resolveBodyOnly: true }
			);
		} catch (error) {
			throw formatMultiloginError(error);
		}
	}

	async stop(id) {
		try {
			return await got.get(`${this.v1}/profile/stop?profileId=${id}`, {
				responseType: "json",
				resolveBodyOnly: true,
			});
		} catch (error) {
			throw formatMultiloginError(error);
		}
	}
};
