/* eslint-disable */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const epayco = require('epayco-sdk-node')({
	apiKey: process.env.EPAYCO_PUBLIC_KEY,
	privateKey: process.env.EPAYCO_PRIVATE_KEY,
	lang: 'ES',
	test: true,
});

const app = express();

app.use(cors());
app.use(express.json());

const plans = [
	{
		id_plan: 'plan-pro',
		name: 'Pro',
		description: 'Plan Pro de Artiefy',
		amount: 100000,
		currency: 'COP',
		interval: 'month',
		interval_count: 1,
		trial_days: 15,
	},
	{
		id_plan: 'plan-premium',
		name: 'Premium',
		description: 'Plan Premium de Artiefy',
		amount: 150000,
		currency: 'COP',
		interval: 'month',
		interval_count: 1,
		trial_days: 0,
	},
	{
		id_plan: 'plan-enterprise',
		name: 'Enterprise',
		description: 'Plan Enterprise de Artiefy',
		amount: 200000,
		currency: 'COP',
		interval: 'month',
		interval_count: 1,
		trial_days: 0,
	},
];

// Crear los planes al iniciar el servidor si no existen
async function createPlans() {
	for (const plan of plans) {
		try {
			const existingPlan = await epayco.plans.get(plan.id_plan);
			if (!existingPlan) {
				const createdPlan = await epayco.plans.create(plan);
				console.log(
					`Plan ${plan.name} creado con éxito. Plan ID: ${createdPlan.id_plan}`
				);
			} else {
				console.log(
					`Plan ${plan.name} ya existe. Plan ID: ${existingPlan.id_plan}`
				);
			}
		} catch (err) {
			console.error(`Error al verificar o crear el plan ${plan.name}:`, err);
		}
	}
}

createPlans().then(() => {
	console.log('Todos los planes han sido creados o verificados');
});

// Paso 1: Crear token
app.post('/api/create-token', async (req, res) => {
	try {
		const token = await epayco.token.create(req.body.credit_info);
		console.log('Token ID:', token.id);
		res.json(token);
	} catch (err) {
		console.error('Error al crear token:', err);
		res.status(500).json({ error: err.message });
	}
});

// Paso 2: Crear customer
app.post('/api/create-customer', async (req, res) => {
	try {
		const customer = await epayco.customers.create(req.body.customer_info);
		console.log('Customer ID:', customer.data.customerId);
		res.json(customer);
	} catch (err) {
		console.error('Error al crear customer:', err);
		res.status(500).json({ error: err.message });
	}
});

// Paso 3: Crear suscripción
app.post('/api/create-subscription', async (req, res) => {
	try {
		const subscription = await epayco.subscriptions.create(
			req.body.subscription_info
		);
		console.log('Subscription ID:', subscription.id);
		res.json(subscription);
	} catch (err) {
		console.error('Error al crear suscripción:', err);
		res.status(500).json({ error: err.message });
	}
});

// Paso 4: Realizar cargo a la suscripción
app.post('/api/charge-subscription', async (req, res) => {
	try {
		const charge = await epayco.subscriptions.charge(
			req.body.subscription_info
		);
		console.log('Payment ID:', charge.id);
		res.json(charge);
	} catch (err) {
		console.error('Error al realizar cargo a la suscripción:', err);
		res.status(500).json({ error: err.message });
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
