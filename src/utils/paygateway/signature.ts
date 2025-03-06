import crypto from 'crypto';

export function calculateSignature(
	apiKey: string,
	merchantId: string,
	referenceCode: string,
	amount: string,
	currency: string,
	algorithm: 'md5' | 'sha1' | 'sha256' = 'md5'
): string {
	const data = [apiKey, merchantId, referenceCode, amount, currency].join('~');
	return crypto.createHash(algorithm).update(data).digest('hex');
}
