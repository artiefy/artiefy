import crypto from 'crypto';

export function calculateSignature(
	apiKey: string,
	merchantId: string,
	referenceCode: string,
	amount: string,
	currency: string
): string {
	const data = [apiKey, merchantId, referenceCode, amount, currency].join('~');
	return crypto.createHash('md5').update(data).digest('hex');
}