import { MD5 } from 'crypto-js';

/**
 * Función para calcular el hash MD5.
 *
 * @param {string} apiKey - Tu clave API.
 * @param {string} merchantId - Tu ID de comerciante.
 * @param {string} reference - El código de referencia para la transacción.
 * @param {string} price - El monto de la transacción.
 * @param {string} currency - La moneda de la transacción.
 * @returns {string} - El hash MD5 generado.
 */
export function calculateMD5(
	apiKey: string,
	merchantId: string,
	reference: string,
	price: string,
	currency: string
): string {
	const concatenatedArray = [apiKey, merchantId, reference, price, currency];
	const concatenatedString = concatenatedArray.join('~');
	const hash = MD5(concatenatedString).toString();
	return hash;
}
