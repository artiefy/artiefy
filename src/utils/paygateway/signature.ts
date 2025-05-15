import crypto from 'crypto';

export function calculateSignature(
	apiKey: string,
	merchantId: string,
	referenceCode: string,
	amount: string,
	currency: string
): string {
	// Asegurar que amount tenga dos decimales
	const formattedAmount = Number(amount).toFixed(2);

	// Construir la cadena exactamente como especifica PayU
	const data = `${apiKey}~${merchantId}~${referenceCode}~${formattedAmount}~${currency}`;

	// Usar MD5 como especifica la documentación
	return crypto.createHash('md5').update(data).digest('hex');
}
