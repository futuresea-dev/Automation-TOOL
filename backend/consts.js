module.exports = {
	blockedResources: ['facebook.com'],
	multilogin: {
		// profileId: "634773b7-bf8a-402f-a221-95ceb2637f4e",
		port: 35000,
	},
	puppeteerOpts: {
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-infobars',
			'--window-position=0,0',
			'--ignore-certifcate-errors',
			'--ignore-certifcate-errors-spki-list',
		],
	},
	endpoints: {
		enterLicensePlate: 'https://www.autoscout24.nl/offerb2c/data/newdecision/licensePlate/',
		listingPage: 'https://aanbod.autoscout24.nl/listing?pref=lp',
	},
	rcApiKey: '3d0be355935176c352d31a9ffccffc0f',
	zyteProxy: 'http://b7d2456541444a93870ba72cf5050849:@proxy.crawlera.com:8011',
};
