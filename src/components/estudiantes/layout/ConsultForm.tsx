'use client';
import { useState } from 'react';

import { Button } from '~/components/estudiantes/ui/button';

type Result = Record<string, string | number>;

const ConsultForm: React.FC = () => {
	const [orderId, setOrderId] = useState('');
	const [transactionId, setTransactionId] = useState('');
	const [referenceCode, setReferenceCode] = useState('');
	const [result, setResult] = useState<Result | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleConsult = async () => {
		setError(null);
		setResult(null);

		try {
			const response = await fetch('/api/consultTransaction', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					orderId: orderId ? parseInt(orderId) : undefined,
					transactionId,
					referenceCode,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to fetch transaction data');
			}

			const data: Result = (await response.json()) as Result;
			setResult(data);
		} catch (error) {
			setError((error as Error).message);
		}
	};

	return (
		<div className="form">
			<h3 className="payer-info-title">Consultar Transacción</h3>
			<div className="grid grid-cols-1 gap-y-4">
				<label className="label">
					<span className="title">Order ID</span>
					<input
						type="text"
						name="orderId"
						placeholder="Order ID"
						value={orderId}
						onChange={(e) => setOrderId(e.target.value)}
						className="input-field"
					/>
				</label>
				<label className="label">
					<span className="title">Transaction ID</span>
					<input
						type="text"
						name="transactionId"
						placeholder="Transaction ID"
						value={transactionId}
						onChange={(e) => setTransactionId(e.target.value)}
						className="input-field"
					/>
				</label>
				<label className="label">
					<span className="title">Reference Code</span>
					<input
						type="text"
						name="referenceCode"
						placeholder="Reference Code"
						value={referenceCode}
						onChange={(e) => setReferenceCode(e.target.value)}
						className="input-field"
					/>
				</label>
			</div>
			<Button type="button" className="checkout-btn" onClick={handleConsult}>
				Consultar
			</Button>
			{error && <p className="error">{error}</p>}
			{result && (
				<div className="result">
					<pre>{JSON.stringify(result, null, 2)}</pre>
				</div>
			)}
		</div>
	);
};

export default ConsultForm;
