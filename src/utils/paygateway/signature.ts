import MD5 from 'crypto-js/md5';

export function calculateMD5(
	apiKey: string,
	merchantId: string,
	referenceCode: string,
	amount: string,
	currency: string
): string {
	const data = [apiKey, merchantId, referenceCode, amount, currency].join('~');
	return MD5(data).toString();
}
