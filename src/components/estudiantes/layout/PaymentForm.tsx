'use client';

import { useState, useEffect } from 'react';

import { useUser } from '@clerk/nextjs';

import '~/styles/form.css';
import BuyerInfoForm from '~/components/estudiantes/layout/BuyerInfoForm';
import { validateFormData } from '~/utils/paygateway/validation';

import type { FormData, Product } from '~/types/payu';

const PaymentForm: React.FC<{ selectedProduct: Product }> = ({
	selectedProduct,
}) => {
	const { user } = useUser();
	const [error, setError] = useState<string | null>(null);
	const buyerEmail = user?.emailAddresses[0]?.emailAddress ?? '';
	const buyerFullName = user?.fullName ?? '';
	const [telephone, setTelephone] = useState('');
	const [loading, setLoading] = useState(false);
	const [showErrors, setShowErrors] = useState(false);
	const [errors, setErrors] = useState<{
		telephone?: string;
		termsAndConditions?: string;
		privacyPolicy?: string;
	}>({});
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [privacyAccepted, setPrivacyAccepted] = useState(false);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;
		if (name === 'telephone') setTelephone(value);
		if (name === 'termsAndConditions') setTermsAccepted(checked);
		if (name === 'privacyPolicy') setPrivacyAccepted(checked);

		if (showErrors) {
			const newErrors = validateFormData(
				telephone,
				termsAccepted,
				privacyAccepted
			);
			setErrors(newErrors);
		}
	};

	useEffect(() => {
		if (showErrors) {
			const newErrors = validateFormData(
				telephone,
				termsAccepted,
				privacyAccepted
			);
			setErrors(newErrors);
		}
	}, [telephone, termsAccepted, privacyAccepted, showErrors]);

	const handleSubmit = async (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => {
		event.preventDefault();

		const newErrors = validateFormData(
			telephone,
			termsAccepted,
			privacyAccepted
		);
		if (
			Object.keys(newErrors).length > 0 ||
			!termsAccepted ||
			!privacyAccepted
		) {
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

			const form = document.createElement('form');
			form.method = 'POST';
			form.action =
				'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';
			form.target = '_blank'; // Open in a new tab

			for (const key in data) {
				if (Object.prototype.hasOwnProperty.call(data, key)) {
					const hiddenField = document.createElement('input');
					hiddenField.type = 'hidden';
					hiddenField.name = key;
					hiddenField.value = String(data[key as keyof FormData]);
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
				termsAndConditions={termsAccepted}
				privacyPolicy={privacyAccepted}
				onChangeAction={handleInputChange} // Changed from onChange to onChangeAction
				showErrors={showErrors}
				errors={errors}
				onSubmitAction={handleSubmit} // Changed from onSubmit to onSubmitAction
				loading={loading}
			/>
			{error && <p className="error">{error}</p>}
		</form>
	);
};

export default PaymentForm;
