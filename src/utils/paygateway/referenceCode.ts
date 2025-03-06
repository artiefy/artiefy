import CryptoJS from 'crypto-js';

// Función para generar un código de referencia aleatorio
export function generateReferenceCode(): string {
	const timestamp = Date.now().toString();
	return CryptoJS.MD5(timestamp).toString();
}
