import CryptoJS from 'crypto-js';

// Función para calcular el hash MD5
export function calculateMD5(
	apiKey: string,
	merchantId: string,
	referenceCode: string,
	amount: string,
	currency: string
): string {
	const data = [apiKey, merchantId, referenceCode, amount, currency].join('~');
	return CryptoJS.MD5(data).toString();
}
