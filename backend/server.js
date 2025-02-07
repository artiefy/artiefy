/* eslint-disable */

const express = require('express');
const bodyParser = require('body-parser');
const epayco = require('epayco-sdk-node')({
	apiKey: 'd107d0ce011cd115889215bb87005b1c',
	privateKey: '3385998ef139bcb2eda8012b41e7035c',
	lang: 'ES',
	test: true,
});

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

app.post('/create-token', (req, res) => {
	const creditInfo = req.body.card_info;
	epayco.token
		.create(creditInfo)
		.then((token) => res.json(token))
		.catch((err) => res.status(500).json({ error: err.message }));
});

app.post('/create-customer', (req, res) => {
	const customerInfo = req.body;
	epayco.customers
		.create(customerInfo)
		.then((customer) => res.json(customer))
		.catch((err) => res.status(500).json({ error: err.message }));
});

app.post('/create-subscription', (req, res) => {
	const subscriptionInfo = req.body;
	epayco.subscriptions
		.create(subscriptionInfo)
		.then((subscription) => res.json(subscription))
		.catch((err) => res.status(500).json({ error: err.message }));
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
