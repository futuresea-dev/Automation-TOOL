const playwright = require('playwright');
const got = require('got').default;
const utils = require('./utils');
const consts = require('./consts');
const MultiloginAPI = require('./MultiloginAPI');
// const { URL } = require("url");
// const httpsProxyAgent = require("https-proxy-agent");
// const httpProxyAgent = require("http-proxy-agent");
// const stealth = require("./playwrightStealth/index");

const toBlock = [
	/doubleclick\.net/i,
	/insurads\.com/i,
	/pubmatic\.com/i,
	/adsystem\.com/i,
	/optimizely\.com/i,
	/krxd\.net/i,
	/ciuvo.*js/i,
];

class Browser {
	constructor(headless) {
		this.headless = Boolean(headless);
		this.mAPI = new MultiloginAPI(consts.multilogin.port);
		/** @type {playwright.Browser}*/ this.browser = null;
		/**@type {playwright.BrowserContext}*/ this.context = null;
		/**@type {playwright.Page}*/ this.page = null;
	}

	async init({ profileId }) {
		//! DEVONLY
		// {
		// 	this.browser = await playwright.chromium.launch({
		// 		headless: false,
		// 	});

		// 	this.context = await this.browser.newContext({ viewportSize: { width: 1800, height: 1000 } });

		// 	this.page = await this.context.newPage();
		// 	await this.page.setViewportSize({ width: 1200, height: 700 });
		// 	await this.page.setDefaultTimeout(5 * 1000);

		// 	this.page.evalClick = async (selector, wait = true) => {
		// 		if (wait) await this.page.waitForSelector(selector);
		// 		await this.page.evaluate((selector) => document.querySelector(selector).click(), selector);
		// 	};

		// 	return this;
		// }

		const { mAPI } = this;

		console.log('launching multilogin browser...');
		const ws = (await mAPI.start(profileId)).value;

		this.browser = await playwright.chromium.connect({
			wsEndpoint: ws,
			// slowMo: 100,
		});
		await utils.wait(5);

		/** @type {playwright.ChromiumBrowserContext} */
		this.context = this.browser.contexts()[0];
		/**
		 * @type {playwright.Page}
		 */
		const page = (this.page = this.context.pages()[0]);

		this.client = await this.context.newCDPSession(page);
		await this.client.send('Network.clearBrowserCookies');
		await this.client.send('Network.clearBrowserCache');

		// page.route(/.*/, (route, request) => {
		// 	if (toBlock.some((exp) => request.url().match(exp))) {
		// 		// console.log(`aborted ${request.url()}`);
		// 		return route.abort();
		// 	}
		// 	route.continue();
		// });

		page.evalClick = async (selector, wait = true) => {
			if (wait) await page.waitForSelector(selector);
			await page.evaluate((selector) => document.querySelector(selector).click(), selector);
		};

		page.on('dialog', (d) => d.accept());

		return this;
	}

	async click(page, selector, opts = { ignoreError: false }) {
		try {
			await page.click(selector, opts);
		} catch (error) {
			if (opts.ignoreError) return;
			throw error;
		}
	}

	async close() {
		if (this.browser) await this.browser.close();
		this.browser = undefined;
	}
}

module.exports = Browser;
