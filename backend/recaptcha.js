const fs = require('fs');
const _ = require('lodash');
const got = require('got').default;
const utils = require('./utils');
const FormData = require('form-data');

const consts = require('./consts');
const headers = {
	Accept: 'application/json',
};

async function sendSiteKey({ id, url, enterprise = false }) {
	const rcService = await got.get(`http://2captcha.com/in.php`, {
		searchParams: {
			key: consts.rcApiKey,
			method: 'userrecaptcha',
			googlekey: id,
			json: 1,
			...(enterprise && {
				enterprise: 1,
			}),
			pageurl: url,
		},
	});

	const requestId = JSON.parse(rcService.body).request;
	return requestId;
}

async function sendSiteKeyDBC({ id, url, enterprise = false }) {
	const form = new FormData();

	const params = {
		username: 'jasperlauritsen888@gmail.com',
		password: 'Attila6685',
		type: 4,
		token_params: {
			googlekey: id,
			pageurl: url,
		},
	};

	for (const [k, v] of Object.entries(params)) {
		form.append(k, _.isPlainObject(v) ? JSON.stringify(v) : v);
	}

	const rcService = await got.post(`http://api.dbcapi.me/api/captcha`, {
		body: form,
		headers,
	});

	const captcha = JSON.parse(rcService.body).captcha;
	return captcha;
}

async function sendImg({ base64Img, lang, instructions, grid }) {
	const rcService = await got.post(`http://2captcha.com/in.php`, {
		body: JSON.stringify({
			body: base64Img,
		}),
		searchParams: {
			key: consts.rcApiKey,
			method: 'base64',
			lang: lang || 'en',
			textinstructions: instructions,
			recaptcharows: grid,
			recaptchacols: grid,
			can_no_answer: 1,
			json: 1,
		},
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const requestId = JSON.parse(rcService.body).request;
	if (!requestId) {
		debugger;
		throw new Error(`2captcha respones has no requestId`);
	}

	return requestId;
}

async function sendImgDBC({ imgLocalPath, bannerB64, bannerText, grid } = {}) {
	try {
		const form = new FormData();

		[
			['username', 'jasperlauritsen888@gmail.com'],
			['password', 'Attila6685'],
			['captchafile', fs.createReadStream(imgLocalPath)],
			['banner_text', `select all squares with ${bannerText}.`],
			['type', '3'],
			['grid', grid && `${grid}x${grid}`],
		].forEach(([k, v]) => v && form.append(k, v));

		const rcService = await got.post(`http://api.dbcapi.me/api/captcha`, {
			body: form,
			headers,
		});

		const requestId = JSON.parse(rcService.body).captcha;
		if (!requestId) {
			debugger;
			throw new Error(`2captcha respones has no requestId`);
		}

		return requestId;
	} catch (error) {
		debugger;
	}
}

async function getResponse(requestId) {
	let token;
	while (!token) {
		await utils.wait(2);
		const response = JSON.parse(
			(
				await got.get(`http://2captcha.com/res.php`, {
					searchParams: {
						key: consts.rcApiKey,
						action: 'get',
						id: requestId,
						json: 1,
					},
				})
			).body
		);
		if (response.request === 'CAPCHA_NOT_READY') continue;
		token = response.request;
	}

	return token;
}

async function getResponseDBC(requestId) {
	let text;
	while (!text) {
		await utils.wait(2);
		const response = JSON.parse(
			(
				await got.get(`http://api.dbcapi.me/api/captcha/${requestId}`, {
					headers,
				})
			).body
		);
		if (!response.text || response.text === '?') continue;
		text = response.text;
	}

	return text;
}

function findRecaptchaClients() {
	// eslint-disable-next-line camelcase
	if (typeof ___grecaptcha_cfg !== 'undefined') {
		// eslint-disable-next-line camelcase, no-undef
		return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {
			const data = { id: cid, version: cid >= 10000 ? 'V3' : 'V2' };
			const objects = Object.entries(client).filter(([_, value]) => value && typeof value === 'object');

			objects.forEach(([toplevelKey, toplevel]) => {
				const found = Object.entries(toplevel).find(([_, value]) => value && typeof value === 'object' && 'sitekey' in value && 'size' in value);

				if (typeof toplevel === 'object' && toplevel instanceof HTMLElement && toplevel['tagName'] === 'DIV') {
					data.pageurl = toplevel.baseURI;
				}

				if (found) {
					const [sublevelKey, sublevel] = found;

					data.sitekey = sublevel.sitekey;
					const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
					const callback = sublevel[callbackKey];
					if (!callback) {
						data.callback = null;
						data.function = null;
					} else {
						data.function = callback;
						const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `['${key}']`).join('');
						data.callback = `___grecaptcha_cfg.clients${keys}`;
					}
				}
			});
			return data;
		});
	}
	return [];
}

function defineFindRecaptchaClients(page) {
	return page.evaluate(`window.findRecaptchaClients = ${findRecaptchaClients.toString()}`);
}

async function solveCaptcha({ id, url, enterprise = false } = {}) {
	const requestId = await sendSiteKey({ id, url, enterprise });
	return await getResponse(requestId);
}

async function solveCaptchaDBC({ id, url } = {}) {
	const requestId = await sendSiteKeyDBC({ id, url });
	return await getResponseDBC(requestId);
}

async function solveImgCaptcha(base64Img, { lang = 'en', instructions, grid } = {}) {
	const requestId = await sendImg({ base64Img, lang, instructions, grid });
	return await getResponse(requestId);
}

async function solveImgCaptchaDBC(imgLocalPath, { bannerB64, bannerText, grid } = {}) {
	const requestId = await sendImgDBC({ imgLocalPath, bannerB64, bannerText, grid });
	return await getResponseDBC(requestId);
}

module.exports = {
	sendSiteKey,
	getToken: getResponse,
	solveCaptcha,
	solveCaptchaDBC,
	findRecaptchaClients,
	defineFindRecaptchaClients,
	solveImgCaptcha,
	solveImgCaptchaDBC,
};
