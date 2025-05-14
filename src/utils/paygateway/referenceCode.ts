import crypto from 'crypto';

// Función para generar un código de referencia aleatorio
export function generateReferenceCode(): string {
	const timestamp = Date.now().toString();
	return crypto.createHash('md5').update(timestamp).digest('hex');
}