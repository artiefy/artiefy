import { createTransporter } from './notifications';

export async function verifyEmailConfig(): Promise<boolean> {
	try {
		const transporter = createTransporter();
		const isReady = await transporter.verify();

		if (isReady) {
			console.log('✅ Servidor SMTP listo para enviar emails');
			return true;
		}
	} catch (error) {
		console.error('❌ Error en la configuración del servidor SMTP:', error);
	}
	return false;
}
