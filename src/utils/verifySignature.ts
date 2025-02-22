import crypto from 'crypto';

interface PaymentData {
	merchant_id: string;
	reference_sale: string;
	value: string;
	currency: string;
	state_pol: string;
}

function calculateMD5ForVerification(
	apiKey: string,
	merchantId: string,
	referenceCode: string,
	amount: string,
	currency: string,
	statePol: string
): string {
	const formattedValue = parseFloat(amount).toFixed(1);
	const data = [
		apiKey,
		merchantId,
		referenceCode,
		formattedValue,
		currency,
		statePol,
	].join('~');
	console.log('Data for MD5:', data); // Log the data used for MD5
	return crypto.createHash('md5').update(data).digest('hex');
}

export function verifySignature(
	paymentData: PaymentData,
	signature: string
): boolean {
	const { merchant_id, reference_sale, value, currency, state_pol } =
		paymentData;
	const apiKey = process.env.API_KEY; // Cambiado a API_KEY

	if (!apiKey) {
		throw new Error('API_KEY is not defined');
	}

	// Generar la firma utilizando los datos de la transacción
	const generatedSignature = calculateMD5ForVerification(
		apiKey,
		merchant_id,
		reference_sale,
		value,
		currency,
		state_pol
	);
	console.log('Generated Signature:', generatedSignature); // Log the generated signature
	console.log('Received Signature:', signature); // Log the received signature
	// Comparar la firma generada con la firma recibida
	return generatedSignature === signature;
}
