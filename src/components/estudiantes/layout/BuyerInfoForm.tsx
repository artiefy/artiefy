import React from 'react';

interface BuyerInfoFormProps {
	formData: { buyerEmail: string; buyerFullName: string; telephone: string };
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BuyerInfoForm: React.FC<BuyerInfoFormProps> = ({
	formData,
	onChange,
}) => (
	<div className="grid grid-cols-1 gap-y-2">
		<input
			type="email"
			name="buyerEmail"
			placeholder="Enter your email"
			value={formData.buyerEmail}
			onChange={onChange}
			className="input-field"
			required
		/>
		<input
			type="text"
			name="buyerFullName"
			placeholder="Enter your full name"
			value={formData.buyerFullName}
			onChange={onChange}
			className="input-field"
			required
		/>
		<input
			type="tel"
			name="telephone"
			placeholder="Enter your telephone"
			value={formData.telephone}
			onChange={onChange}
			className="input-field"
			required
		/>
	</div>
);

export default BuyerInfoForm;
