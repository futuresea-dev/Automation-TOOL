const got = require("got").default;
const local = require("./local");
const fs = require("fs");

class ProxyManager {
	constructor() {
		this.base = "http://127.0.0.1:22999/api";
	}
	async create({ country = "nl", zone = "data_center", os = "win" } = {}) {
		if (!local.current_port)
			throw new Error("local.current_port is undefined!");
		const port = ++local.current_port;

		const result = await got.post(`${this.base}/proxies`, {
			json: {
				proxy: {
					port,
					preset: "session_long",
					proxy_type: "persist",
					country,
					zone,
					os,
					ssl: true,
				},
			},
			resolveBodyOnly: true,
			responseType: "json",
		});

		fs.writeFileSync("./local.json", JSON.stringify(local, null, 2), "utf8");

		return { port };
	}

	async delete(port) {
		const result = await got.delete(`${this.base}/proxies/${port}`);
		return result;
	}

	async refreshSession(port = 24000) {
		const result = await got.get(`${this.base}/refresh_sessions/${port}`);
		return result;
	}
}

module.exports = new ProxyManager();
