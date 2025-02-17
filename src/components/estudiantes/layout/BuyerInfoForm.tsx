import React from 'react';
import { type FormData } from '~/types/payu';

interface BuyerInfoFormProps {
	formData: Pick<FormData, 'buyerEmail' | 'buyerFullName' | 'telephone'>;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	showErrors: boolean;
	errors: {
		buyerEmail?: string;
		buyerFullName?: string;
		telephone?: string;
	};
}

const BuyerInfoForm: React.FC<BuyerInfoFormProps> = ({
	formData,
	onChange,
	showErrors,
	errors,
}) => (
	<div className="grid grid-cols-1 gap-y-4">
		<label className="label">
			<span className="title">Correo Electrónico</span>
			<input
				type="email"
				name="buyerEmail"
				placeholder="ejemplo@correo.com"
				value={formData.buyerEmail}
				onChange={onChange}
				className={`input-field ${showErrors && errors.buyerEmail ? 'input-error' : ''}`}
				required
			/>
			{showErrors && errors.buyerEmail && (
				<span className="error-message">{errors.buyerEmail}</span>
			)}
		</label>
		<label className="label">
			<span className="title">Nombre Completo</span>
			<input
				type="text"
				name="buyerFullName"
				placeholder="Juan Pérez"
				value={formData.buyerFullName}
				onChange={onChange}
				className={`input-field ${showErrors && errors.buyerFullName ? 'input-error' : ''}`}
				required
			/>
			{showErrors && errors.buyerFullName && (
				<span className="error-message">{errors.buyerFullName}</span>
			)}
		</label>
		<label className="label">
			<span className="title">Teléfono</span>
			<input
				type="tel"
				name="telephone"
				placeholder="+57 3113333332"
				value={formData.telephone}
				onChange={onChange}
				className={`input-field ${showErrors && errors.telephone ? 'input-error' : ''}`}
				required
			/>
			{showErrors && errors.telephone && (
				<span className="error-message">{errors.telephone}</span>
			)}
		</label>
	</div>
);

export default BuyerInfoForm;
