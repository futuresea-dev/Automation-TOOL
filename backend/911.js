const { exec } = require("child_process");
module.exports = {
	changeProxy({ port = 5000, countryCode = "NL" } = {}) {
		return new Promise((r, j) => {
			exec(
				`C:/Users/Administrator/Desktop/911/ProxyTool/AutoProxyTool.exe -changeproxy/${countryCode} -proxyport=${port}`,
				{ shell: "powershell.exe" },
				(err, stdout, stderr) => {
					if (err) return j(err);
					r(stdout);
				}
			);
		});
	},
};
