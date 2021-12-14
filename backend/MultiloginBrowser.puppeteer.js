const _ = require('lodash');

const puppeteer = require('puppeteer');
const pptr = require('puppeteer');

const { createKeyboard } = require('pptr-human-keyboard');

// const utils = require('./utils');
const consts = require('./consts');
const MultiloginAPI = require('./MultiloginAPI');

// const toBlock = [
// 	/doubleclick\.net/i,
// 	/insurads\.com/i,
// 	/pubmatic\.com/i,
// 	/adsystem\.com/i,
// 	/optimizely\.com/i,
// 	/krxd\.net/i,
// 	/ciuvo.*js/i,
// ];

/** @param {pptr.Frame} page */
async function proxyMethods(page) {
	if (page.click) {
		page.evalClick = async (selector, wait = true) => {
			if (wait) await page.waitForSelector(selector);
			await page.evaluate((selector) => document.querySelector(selector).click(), selector);
		};
	}

	if (page.waitForResponse) {
		const waitForResponse = page.waitForResponse.bind(page);
		page.waitForResponse = ((predicate) => {
			if (_.isRegExp(predicate))
				return waitForResponse((res) => {
					const method = res.request().method();
					return !method.match(/options/i) && res.url().match(predicate);
				});
			else return waitForResponse(predicate);
		}).bind(page);
	}

	for (const name of ['click', 'type', '$']) {
		if (!page[name]) continue;
		const original = page[name].bind(page);
		page[name] = async function (selector, ...rest) {
			await page.waitForSelector(selector);
			let result;

			switch (name) {
				case 'type':
					const keybr = await createKeyboard(page);
					await page.click(selector);
					result = await keybr.type(rest[0], true);
					break;

				default:
					result = await original(selector, ...rest);
					break;
			}

			return result;
		};
	}
}

class Browser {
	constructor(headless) {
		this.headless = Boolean(headless);
		this.mAPI = new MultiloginAPI(consts.multilogin.port);
		/** @type {pptr.Browser}*/ this.browser = null;
		/**@type {pptr.BrowserContext}*/ this.context = null;
		/**@type {pptr.Page}*/ this.page = null;
	}

	async init({ profileId }) {
		//! DEVONLY
		// {
		// 	this.browser = await puppeteer.launch({
		// 		headless: false,
		// 		args: [/* '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', */ '--window-size=1280,720'],
		// 	});

		// 	this.page = await this.browser.newPage();

		// 	await this.page.setViewport({ width: 1280, height: 720 });
		// 	await this.page.setDefaultTimeout(15 * 1000);

		// 	return this;
		// }

		const { mAPI } = this;

		console.log('launching multilogin browser...');
		const ws = (await mAPI.start(profileId)).value;

		this.browser = await puppeteer.connect({
			browserWSEndpoint: ws,
			slowMo: 10,
		});
		// await utils.wait(5);

		this.context = this.browser.browserContexts()[0];

		/** @type {pptr.Page} */
		this.page = (await this.context.pages())[0];
		await proxyMethods(this.page);

		this.browser.on('targetcreated', async (target) => {
			const page = await target.page();
			if (page) await proxyMethods(page);
		});
		this.page.on('frameattached', proxyMethods);

		this.client = this.page.client();
		await this.client.send('Network.clearBrowserCookies');
		await this.client.send('Network.clearBrowserCache');

		this.page.on('dialog', (d) => d.accept());

		await this.page.setViewport({ width: 1280, height: 720 });
		await this.page.setDefaultTimeout(10 * 1000);

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
