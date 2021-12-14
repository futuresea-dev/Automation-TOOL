const got = require("got").default;
const tough = require("tough-cookie");

function Request() {
	const instance = got.extend({
		headers: {
			"accept-encoding": `gzip, deflate, br`,
			"accept-language": `en-US,en;q=0.9`,
			"cache-control": `no-cache`,
			dnt: `1`,
			pragma: `no-cache`,
			"sec-ch-ua": `"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"`,
			"sec-ch-ua-mobile": `?0`,
			"sec-fetch-dest": `document`,
			"sec-fetch-mode": `navigate`,
			"sec-fetch-site": `same-origin`,
			"sec-fetch-user": `?1`,
			"upgrade-insecure-requests": `1`,
			"user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36`,
		},
		hooks: {
			beforeRequest: [
				(options) => {
					const requestCookie = options.headers.cookie || "";
					const jarCookie = instance.cookieJar.getCookieStringSync(options.url.href) || "";
					Object.assign(options.headers, {
						"user-agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
						Connection: "keep-alive",
						cookie: [jarCookie, requestCookie].join(" ").trim(),
					});
				},
			],

			beforeRedirect: [
				(options, response) => {
					instance.setCookies(response);
					options.headers.cookie = instance.cookieJar.getCookieStringSync(options.url.href) || "";
				},
			],

			afterResponse: [
				(response, retryWithMergedOptions) => {
					instance.setCookies(response);
					return response;
				},
			],
		},
		mutableDefaults: true,
	});

	instance.cookieJar = new tough.CookieJar();
	instance.setCookies = function (response) {
		response.headers["set-cookie"]?.forEach((cookieStr) => {
			let domain = cookieStr.match(/domain=([^;]+);/)?.[1];
			domain = domain ? `http://${domain}` : response.requestUrl;
			try {
				instance.cookieJar.setCookieSync(cookieStr, domain);
			} catch (error) {
				debugger;
			}
		});
	};

	return instance;
}

module.exports = Request;
