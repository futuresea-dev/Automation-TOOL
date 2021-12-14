const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const Browser = require('./MultiloginBrowser.puppeteer');
const recaptcha = require('./recaptcha');
const chalk = require('chalk');
const proxyManager = require('./proxyManager');
const _ = require('lodash');
const utils = require('./utils.js');

// const proxyManager = require("./911");

//#region local captcha solver
// const Captcha = require('2captcha');
// const imageToBase64 = require('image-to-base64');
// const urlToBase64 = require('@aistiak/url-to-base64');

// const solver = new Captcha.Solver('3d0be355935176c352d31a9ffccffc0f');

// async function solveCaptcha(page) {
// 	await utils.wait(2);

// 	const mainFrame = await (
// 		await page.$('#captcha iframe[src^="https://www.google.com/recaptcha/enterprise/anchor"]')
// 	).contentFrame();
// 	await mainFrame.click('#recaptcha-anchor');

// 	await utils.wait(2); // TODO: change this to wait for a response

// 	const bFrame = await (
// 		await page.$('iframe[src^="https://www.google.com/recaptcha/enterprise/bframe"]')
// 	).contentFrame();

// 	while (true) {
// 		const instructions = await bFrame.$eval(
// 			'.rc-imageselect-desc-no-canonical, .rc-imageselect-desc',
// 			(el) => el.textContent
// 		);
// 		if (!instructions.match('squares')) {
// 			// console.log('captcha: skipping (it asks for images not squares)');
// 			await bFrame.click('#recaptcha-reload-button');
// 			await utils.wait(2);
// 			continue;
// 		}

// 		const bannerText = await bFrame.$eval(
// 			'.rc-imageselect-desc-no-canonical strong, .rc-imageselect-desc strong',
// 			(el) => el.textContent
// 		);
// 		const grid = await bFrame.$eval('.rc-imageselect-table-44, .rc-imageselect-table-33', (el) => {
// 			return el.className.match('-33') ? 3 : 4;
// 		});
// 		const imgUrl = await bFrame.$eval('#rc-imageselect-target img', (el) => el.getAttribute('src'));

// 		// TODO: asset img is a url
// 		// const base64 = await urlToBase64(imgUrl);
// 		const imgLocalPath = await utils.downloadImage(imgUrl, path.resolve(__dirname, 'captchaImgs/'));
// 		const solve = await recaptcha.solveImgCaptchaDBC(imgLocalPath, {
// 			bannerText,
// 			grid,
// 		});

// 		if (solve === '[]') {
// 			console.log('solve = [], skipping...');
// 			await bFrame.click('#recaptcha-reload-button');
// 			await utils.wait(2);
// 			continue;
// 		}

// 		for (const i of solve.replace(/[^\d,]/g, '').split(',')) {
// 			console.log('i :>> ', i);
// 			await bFrame.evaluate((i) => {
// 				document.querySelectorAll('.rc-imageselect-tile')[i].click();
// 			}, i * 1);
// 			// await utils.wait(_.random(0, 2, true));
// 		}

// 		debugger;
// 	}
// }
//#endregion

async function postCar({ license, email, password, mileage, price, zip, city, phone, images, description, color, profileId }) {
	// const proxy = `lum-customer-c_7b9520dc-zone-data_center-country-nl-session-${
	// 	(1000000 * Math.random()) | 0
	// }:o0eb0xffks51@zproxy.lum-superproxy.io:22225`;

	let b,
		page,
		client,
		shouldRefreshProxy = false,
		crashed = false;

	try {
		license = license.replace(/[^a-zA-Z0-9]/i, '');

		// !OMITTED IN DEV
		await proxyManager.refreshSession(24000);

		b = new Browser();
		({ page, context, client } = await b.init({ profileId }));

		// await page.goto(
		// 	'https://www.autoscout24.nl/entry/auth?client_id=identity-v2&scope=openid+email+profile+offline_access&state=nl-NL%23a65369a034cb4cad8c36aa538dd6523b&pkce_callback=https%3A%2F%2Fwww.autoscout24.nl%2Fidentity%2Foauth%2Fcallback&code_challenge=u81OXeUo3BWhCkRktl2TTxkoZGnJ8is031UkRanLfE8&social_callback=https%3A%2F%2Fwww.autoscout24.nl%2Fidentity%2Foauth%2Fsocial-callback&social_code_challenge=f2af5ba6-0d83-4a22-abe3-4c91281580f5&code_challenge_method=S256&response_type=code&dealerLoginUrl=https%3A%2F%2Faccounts.autoscout24.com%2Foidc%2Fauthorize%3Fclient_id%3Dlistingform%26redirect_uri%3Dhttps%253A%252F%252Fwww.autoscout24.nl%252Flisting-form%252Foidc%252Fcallback%26response_type%3Dcode%26state%3Da75ace75150d471cafea2b3ba681fa6b%26scope%3Dopenid%2Bemail%2Bprofile%2Bas24-listing-images-listing-read%2Bas24-listing-images-car360-delete%2Bas24-lca-ng-listing-write%2Bas24-lca-ng-listing-read%2Bas24-lca-ng-images-upload%2Bas24-lca-ng-images-read%26ui_locales%3Dnl-NL%26as24visitor%3D90cbcfdc99ba4267a6cba87ef6ec5b13%26cid%3D2131458052.1637792137',
		// 	{
		// 		waitUntil: 'domcontentloaded',
		// 	}
		// );

		await page.goto('https://www.autoscout24.nl', {
			waitUntil: 'domcontentloaded',
		});

		console.log('accepting terms & conditions...');
		await page.waitForSelector('iframe[src^="https://cmp-consent-tool.privacymanager.io/"]');
		await utils.wait(3);
		const consentFrame = await (await page.$('iframe[src^="https://cmp-consent-tool.privacymanager.io/"]')).contentFrame();
		await consentFrame.evalClick('#save');

		await page.click('#verkaufen-menu');

		await Promise.all([page.evalClick('#vm-auto'), page.waitForNavigation({ waitUntil: 'domcontentloaded' })]);

		await Promise.all([page.evalClick('#marketplace-cta-top'), page.waitForNavigation({ waitUntil: 'domcontentloaded' })]);

		console.log('entering license...');
		await page.type('input[name=licensePlate]', license);

		await Promise.all([
			page.waitForNavigation({
				waitUntil: 'domcontentloaded',
			}),
			page.keyboard.press('Enter'),
		]);

		await page.type('input#email', email);

		const [nextStepResponse] = await Promise.all([page.waitForResponse(/\/next-step/i), page.click('form button[type=submit]')]);

		// making sure we get the recaptcha in english
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const url = new URL(request.url());
			if (!String(url).startsWith('https://www.google.com/recaptcha/')) return request.continue();

			if (url.searchParams.has('hl')) url.searchParams.set('hl', 'en');

			request.continue({
				url: url + '',
			});
		});

		// should we login or register?
		const { step: nextStep } = await nextStepResponse.json();

		await page.type('input#password', password);

		let regToken;
		if (nextStep.toLowerCase() === 'login') {
			console.log('login in...');
			await page.evalClick('form button[type=submit]');
		} else {
			console.log('registering...');
			await page.evalClick('#dsgvo');
			// await solveCaptcha(page);

			// solving captcha
			await utils.wait(3);
			await recaptcha.defineFindRecaptchaClients(page);
			const { sitekey, pageurl } = await page.evaluate(() => findRecaptchaClients()[0]);

			if (sitekey) {
				console.log('solving captcha...');
				// const regToken =
				const regToken = await recaptcha.solveCaptchaDBC({
					id: sitekey,
					url: pageurl,
					enterprise: true,
				});

				await page.evaluate((token) => {
					const textarea = document.querySelector('#g-recaptcha-response');
					textarea.innerHTML = token;
					findRecaptchaClients()[0].function(token);
				}, regToken);

				await page.evalClick('.modal-box button[type=submit]');
			} else {
				await page.evalClick('.modal-box button[type=submit]');
			}
		}

		shouldRefreshProxy = true;

		await page.waitForNavigation({
			waitUntil: 'domcontentloaded',
		});

		// ! DEVONLY
		// {
		// 	let cookies = JSON.parse(fs.readFileSync('./cookies.json'));
		// 	cookies = cookies.map((cookie) => _.mapValues(cookie, (v, k) => (k === 'expires' ? v * 1 : v)));

		// 	await context.addCookies(cookies);
		// 	await page.goto(
		// 		'https://www.autoscout24.nl/listing-form/index/private/car?&make=46&model=19723&version=2.2d%20SAD%20150%20SkL%20GT&bodytype=5&doors=4&kw=110&fuel=D&gearingtype=M&ccm=2191&weight=1435&consumptionmixed=5.0&consumptioncity=5.9&consumptionhighway=4.6&co2emissionmixed=132&emclass=6&cylinders=4&seats=5&color=10&firstreg_mth=9&firstreg_year=2017&nextInspectionMonth=9&nextInspectionYear=2020&equi=#/'
		// 	);
		// }

		// injections
		await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js' });
		await page.addStyleTag({ content: '.sc-lightbox--fadein {display: none;}' });

		// entry car info
		console.log('entering car info...');

		// await page.evalClick('#feedbackform-container .sc-lightbox__close', { timeout: 10 * 1000 }).catch(_.noop);

		if (typeof color === 'number') await page.evalClick(`#bodyColor input[type="radio"][value="${color}"]`);

		await page.evaluate(async () => {
			let checkboxs = _.chain(document.querySelectorAll('#equipment input[type="checkbox"]')).toArray().shuffle().sampleSize(_.random(20, 40));
			for (const checkbox of checkboxs) checkbox.click();
		});

		phone = phone.split('-');

		// const descriptionIframe = await (await page.$('iframe#description_ifr')).contentFrame();
		await page.type('iframe#description_ifr', (description || '').trim(), { timeout: 30 * 1000 });

		for (const [s, v] of [
			['input#mileage', mileage],
			['input#price', price],
			['input#postalCode', zip],
			['input#locality', city],
			['input#phoneAreaCode', phone[0]],
			['input#phoneSubscriberNumber', phone[1]],
		]) {
			await page.click(s, { clickCount: 3 });
			if (v) await page.type(s, v + '', { delay: 10, timeout: 10 * 1000 });
		}

		await page.evalClick('input[name="hidePhoneNumberYes"]');

		for (const [s, v] of [
			['select#nextInspectionYear', _.random(2022, 2023)],
			['select#nextInspectionMonth', _.random(3, 12)],
		])
			await page.select(s, v + '');

		if (images && images.length) {
			const existingImages = images.filter((x) => fs.existsSync(path.join(__dirname, 'server/images', x)));

			if (existingImages.length !== images.length) console.log(chalk.yellow(`only ${existingImages.length}/${images.length} images exist!`));

			if (existingImages.length)
				await page.setInputFiles(
					'input#images-big-input',
					existingImages.map((x) => path.join(__dirname, 'server/images', x))
				);
		}

		// solving captcha
		await recaptcha.defineFindRecaptchaClients(page);
		const sitekey = await page.evaluate(() => findRecaptchaClients()[0]?.sitekey);

		if (sitekey) {
			console.log('solving captcha...');

			const token = await recaptcha.solveCaptchaDBC({
				id: sitekey,
				url: page.url(),
			});

			console.log('submiting captcha...');
			await page.evaluate(`findRecaptchaClients()[0].function("${token}")`);
		}

		await Promise.all([
			page.waitForNavigation({
				waitUntil: 'domcontentloaded',
			}),
			page.evalClick('#publish'),
		]);

		console.log('getting Link');
		const articleId = await page.url().match(/articleId=([^&]+)/i)[1];

		return `https://www.autoscout24.nl/aanbod/-${articleId}`;
	} catch (error) {
		console.log(error);
		crashed = true;
		debugger;
		return error;
	} finally {
		// if (shouldRefreshProxy) {
		// 	console.log("refreshing proxy...");
		// 	await proxyManager.changeProxy();
		// }
		if (client)
			if (crashed) {
				console.log('stopping profile...');
				client.send('Browser.close');
			} else {
				console.log('stopping profile in 15 sec...');

				setTimeout(() => {
					client.send('Browser.close');
				}, 15 * 1000);
			}
	}
}

module.exports = { postCar };

// console.clear();
// postCar({
// 	images: ['1.jpeg'],
// 	license: 'J828BV',
// 	firstname: 'Stans',
// 	lastname: 'Pol',
// 	email: `temono${_.random(1000, 9999)}@gmail.com`,
// 	password: `nbebJXS!@${_.random(1000, 9999)}`,
// 	mileage: 143000,
// 	price: 21255,
// 	zip: '3708 DL',
// 	city: 'Zeist',
// 	phone: '030-7607405',
// 	description: `
// 	Transmissie: Handgeschakeld
// 	Carrosserievorm: Hatchback
// 	Kilometerslang: 29800
// 	Motorinhoud: 999cm3
// 	Vermogen: 85 kW (116pk)
// 	Cilinders: 3
// 	Leeggewicht: 1132kg
// 	Bouwjaar: 10/2016
// 	APK: 10/2022

// 	Comfort en gemak:
// 	Airconditioning
// 	Armsteun
// 	Elektrische ramen
// 	Start/stop systeem

// 	Entertainment en media:
// 	Bluetooth
// 	Aux
// 	Radio`,
// 	color: 6,
// 	profileId: '276f4cdc-e52a-4457-bb90-47ae89b343ed',
// 	carLink: '',
// 	error: '',
// });
