'use client';

import { useState, useEffect } from 'react';
import { Button } from '~/components/estudiantes/ui/button';
import { config } from '~/config';
import '~/styles/form.css';

interface PaymentFormProps {
	onSuccess: (message: string) => void;
	planId: string;
}

interface ErrorResponse {
	message?: string;
}

export function PaymentForm({ onSuccess, planId }: PaymentFormProps) {
	const [cardNumber, setCardNumber] = useState('');
	const [expYear, setExpYear] = useState('');
	const [expMonth, setExpMonth] = useState('');
	const [cvc, setCvc] = useState('');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [city, setCity] = useState('');
	const [address, setAddress] = useState('');
	const [phone, setPhone] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://checkout.epayco.co/epayco.min.js';
		script.async = true;
		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		// Validar la información de la tarjeta
		if (!/^\d{16}$/.test(cardNumber)) {
			setError('Número de tarjeta inválido');
			setLoading(false);
			return;
		}
		if (!/^\d{3,4}$/.test(cvc)) {
			setError('CVC inválido');
			setLoading(false);
			return;
		}
		if (!/^\d{4}$/.test(expYear)) {
			setError('Año de expiración inválido');
			setLoading(false);
			return;
		}
		if (
			!/^\d{1,2}$/.test(expMonth) ||
			parseInt(expMonth) < 1 ||
			parseInt(expMonth) > 12
		) {
			setError('Mes de expiración inválido');
			setLoading(false);
			return;
		}

		try {
			// Paso 1: Crear token
			const tokenResponse = await fetch(`${config.apiUrl}/api/create-token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					credit_info: {
						'card[number]': cardNumber,
						'card[exp_year]': expYear,
						'card[exp_month]': expMonth,
						'card[cvc]': cvc,
						hasCvv: true,
					},
				}),
			});

			if (!tokenResponse.ok) {
				const errorData = (await tokenResponse.json()) as ErrorResponse;
				throw new Error(errorData.message ?? 'Error al crear el token');
			}

			const tokenData = (await tokenResponse.json()) as { id: string };
			const tokenId: string = tokenData.id;
			console.log('Token ID:', tokenId);

			// Paso 2: Crear customer
			const customerResponse = await fetch(
				`${config.apiUrl}/api/create-customer`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						customer_info: {
							token_card: tokenId,
							name: name,
							email: email,
							city: city,
							address: address,
							phone: phone,
							cell_phone: phone,
							default: true,
						},
					}),
				}
			);

			if (!customerResponse.ok) {
				const errorData = (await customerResponse.json()) as ErrorResponse;
				throw new Error(errorData.message ?? 'Error al crear el customer');
			}

			const customerData = (await customerResponse.json()) as { data: { customerId: string } };
			const customerId = customerData.data.customerId;
			console.log('Customer ID:', customerId);

			// Paso 3: Crear suscripción
			const subscriptionResponse = await fetch(
				`${config.apiUrl}/api/create-subscription`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						subscription_info: {
							id_plan: planId,
							customer: customerId,
							token_card: tokenId,
							doc_type: 'CC',
							doc_number: phone,
							url_confirmation: `${config.apiUrl}/confirmacion`,
							method_confirmation: 'POST',
						},
					}),
				}
			);

			if (!subscriptionResponse.ok) {
				const errorData = (await subscriptionResponse.json()) as ErrorResponse;
				throw new Error(errorData.message ?? 'Error al crear la suscripción');
			}

			const subscriptionData = (await subscriptionResponse.json()) as { id: string };
			const subscriptionId = subscriptionData.id;
			console.log('Subscription ID:', subscriptionId);

			// Paso 4: Realizar cargo a la suscripción
			const chargeResponse = await fetch(
				`${config.apiUrl}/api/charge-subscription`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						subscription_info: {
							id_plan: planId,
							customer: customerId,
							token_card: tokenId,
							doc_type: 'CC',
							doc_number: phone,
							ip: '190.000.000.000', // IP del cliente
						},
					}),
				}
			);

			if (!chargeResponse.ok) {
				const errorData = (await chargeResponse.json()) as ErrorResponse;
				throw new Error(
					errorData.message ?? 'Error al realizar el cargo a la suscripción'
				);
			}

			const chargeData = (await chargeResponse.json()) as { id: string };
			const paymentId = chargeData.id;
			console.log('Payment ID:', paymentId);

			onSuccess('Pago procesado con éxito');
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError('Error desconocido');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="form rounded-lg">
			<div className="mb-4 grid grid-cols-2 gap-4">
				<div className="label">
					<span className="title">Nombre Del Titular</span>
					<input
						type="text"
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="input-field"
						required
					/>
				</div>
				<div className="label">
					<span className="title">Correo electrónico</span>
					<input
						type="email"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="input-field"
						required
					/>
				</div>
				<div className="label">
					<span className="title">Ciudad</span>
					<input
						type="text"
						id="city"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						className="input-field"
						required
					/>
				</div>
				<div className="label">
					<span className="title">Dirección</span>
					<input
						type="text"
						id="address"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						className="input-field"
						required
					/>
				</div>
				<div className="label">
					<span className="title">Celular</span>
					<input
						type="text"
						id="phone"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						className="input-field"
						required
					/>
				</div>
				<div className="label">
					<span className="title">Número de tarjeta</span>
					<input
						type="text"
						id="cardNumber"
						value={cardNumber}
						onChange={(e) => setCardNumber(e.target.value)}
						className="input-field"
						placeholder="0000 0000 0000 0000"
						required
					/>
				</div>
				<div className="label col-span-1">
					<span className="title">Mes de expiración(MM)</span>
					<input
						type="text"
						id="expMonth"
						value={expMonth}
						onChange={(e) => setExpMonth(e.target.value)}
						className="input-field"
						placeholder="MM"
						required
					/>
				</div>
				<div className="label col-span-1">
					<span className="title">Año de expiración(AAAA)</span>
					<input
						type="text"
						id="expYear"
						value={expYear}
						onChange={(e) => setExpYear(e.target.value)}
						className="input-field"
						placeholder="AAAA"
						required
					/>
				</div>
				<div className="label">
					<span className="title">CVC</span>
					<input
						type="text"
						id="cvc"
						value={cvc}
						onChange={(e) => setCvc(e.target.value)}
						className="input-field"
						placeholder="CVC"
						required
					/>
				</div>
			</div>
			{error && <p className="text-sm text-red-500">{error}</p>}
			<Button type="submit" disabled={loading} className="checkout-btn">
				{loading ? 'Procesando...' : 'Pagar'}
			</Button>
		</form>
	);
}
