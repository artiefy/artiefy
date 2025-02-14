'use client';

import React, { useState } from 'react';
import '~/styles/form.css';
import { FaLock } from 'react-icons/fa';
import BuyerInfoForm from '~/components/estudiantes/layout/BuyerInfoForm';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { type FormData, type Product } from '~/types/payu';

const PaymentForm: React.FC<{ selectedProduct: Product }> = ({
	selectedProduct,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [buyerEmail, setBuyerEmail] = useState('');
	const [buyerFullName, setBuyerFullName] = useState('');
	const [telephone, setTelephone] = useState('');
	const [loading, setLoading] = useState(false);
	const [showErrors, setShowErrors] = useState(false);
	const [errors, setErrors] = useState<{
		buyerEmail?: string;
		buyerFullName?: string;
		telephone?: string;
	}>({});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const newErrors = { ...errors };

		if (name === 'buyerEmail') {
			setBuyerEmail(value);
			if (
				showErrors &&
				!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value)
			) {
				newErrors.buyerEmail =
					'El correo electrónico es obligatorio y debe contener @.';
			} else {
				delete newErrors.buyerEmail;
			}
		}
		if (name === 'buyerFullName') {
			setBuyerFullName(value);
			if (showErrors && !/^[a-zA-Z\s]+$/.test(value)) {
				newErrors.buyerFullName =
					'El nombre completo es obligatorio y debe contener solo letras.';
			} else {
				delete newErrors.buyerFullName;
			}
		}
		if (name === 'telephone') {
			setTelephone(value);
			if (showErrors && !/^\+57\s[0-9]{10}$/.test(value)) {
				newErrors.telephone =
					'El teléfono es obligatorio y debe seguir el formato +57 3113333332.';
			} else {
				delete newErrors.telephone;
			}
		}

		setErrors(newErrors);
		setShowErrors(Object.keys(newErrors).length > 0);
	};

	const handleSubmit = async (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => {
		event.preventDefault();

		const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
		const namePattern = /^[a-zA-Z\s]+$/;
		const phonePattern = /^\+57\s[0-9]{10}$/;

		const newErrors: {
			buyerEmail?: string;
			buyerFullName?: string;
			telephone?: string;
		} = {};

		if (!emailPattern.test(buyerEmail)) {
			newErrors.buyerEmail =
				'El correo electrónico es obligatorio y debe contener @.';
		}
		if (!namePattern.test(buyerFullName)) {
			newErrors.buyerFullName =
				'El nombre completo es obligatorio y debe contener solo letras.';
		}
		if (!phonePattern.test(telephone)) {
			newErrors.telephone =
				'El teléfono es obligatorio y debe seguir el formato +57 3113333332.';
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setShowErrors(true);
			return;
		}

		setLoading(true);

		try {
			const response = await fetch('/api/generatePaymentData', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					productId: selectedProduct.id,
					buyerEmail,
					buyerFullName,
					telephone,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to fetch form data');
			}

			const data: FormData = (await response.json()) as FormData;
			console.log('Form Data:', data);

			const form = document.createElement('form');
			form.method = 'POST';
			form.action =
				'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';

			for (const key in data) {
				if (data.hasOwnProperty(key)) {
					const hiddenField = document.createElement('input');
					hiddenField.type = 'hidden';
					hiddenField.name = key;
					hiddenField.value = data[key as keyof FormData];
					form.appendChild(hiddenField);
				}
			}

			document.body.appendChild(form);
			form.submit();
		} catch (error) {
			setError((error as Error).message);
			setLoading(false);
		}
	};

	return (
		<form className="form">
			<h3 className="payer-info-title">Datos del pagador</h3>
			<BuyerInfoForm
				formData={{ buyerEmail, buyerFullName, telephone }}
				onChange={handleInputChange}
				showErrors={showErrors}
				errors={errors}
			/>
			{error && <p className="error">{error}</p>}
			<div className="security-message">
				<FaLock className="lock-icon" />
				<span>Estás en un formulario de pagos seguro</span>
			</div>
			<Button
				type="button"
				className="checkout-btn"
				onClick={handleSubmit}
				disabled={loading}
			>
				{loading ? (
					<>
						<Icons.spinner
							className="mr-2 text-background"
							style={{ width: '25px', height: '25px' }}
						/>
						<span className="font-bold text-background">
							Redirigiendo a PayU...
						</span>
					</>
				) : (
					'Enviar'
				)}
			</Button>
		</form>
	);
};

export default PaymentForm;
