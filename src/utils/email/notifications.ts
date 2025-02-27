import path from 'path';
import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type {
	Options as SMTPTransportOptions,
	SentMessageInfo,
} from 'nodemailer/lib/smtp-transport';

interface EmailAttachment {
	filename: string;
	path?: string;
	content?: string;
	contentType?: string;
	cid?: string;
}

// Add custom mail options type
interface CustomMailOptions extends Mail.Options {
	dsn?: {
		return?: 'headers' | 'full';
		notify?: ('never' | 'success' | 'failure' | 'delay')[];
		recipient?: string;
	};
}

let transporter: Transporter<SentMessageInfo> | null = null;

export function createTransporter(): Transporter<SentMessageInfo> {
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
			pool: true,
			maxConnections: 3,
			maxMessages: 100,
			socketTimeout: 30000,
			maxTries: 3,
		} as SMTPTransportOptions);

		transporter.on('idle', () => {
			console.log('💤 Pool de conexiones SMTP inactivo');
		});

		transporter.on('error', (err) => {
			console.error('❌ Error en el transporter SMTP:', err);
		});
	}
	return transporter;
}

export function closeTransporter(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		if (!transporter) {
			resolve();
			return;
		}

		try {
			transporter.close();
			transporter = null;
			resolve();
		} catch (err) {
			reject(
				new Error(
					err instanceof Error
						? err.message
						: 'Unknown error closing transporter'
				)
			);
		}
	});
}

export async function sendNotification(
	to: string,
	subject: string,
	htmlContent: string,
	attachments: EmailAttachment[] = []
): Promise<boolean> {
	const transport = createTransporter();

	try {
		const verifyResult = await transport.verify();
		if (!verifyResult) throw new Error('SMTP verification failed');

		const mailOptions: CustomMailOptions = {
			from: {
				name: 'Artiefy',
				address: process.env.EMAIL_USER ?? '',
			},
			to,
			subject,
			html: htmlContent,
			attachments: [
				{
					filename: 'artiefy-logo.png',
					path: path.join(process.cwd(), 'public/artiefy-logo2.png'),
					cid: 'logo@artiefy.com',
				},
				...attachments,
			],
			headers: {
				'X-Priority': '1',
				'X-Mailgun-Variables': JSON.stringify({
					type: 'subscription_notification',
				}),
			},
			dsn: {
				return: 'headers',
				notify: ['failure', 'delay'],
				recipient: process.env.EMAIL_USER,
			},
		};

		const info = await transport.sendMail(mailOptions);

		console.log('✉️ Email enviado:', {
			messageId: info?.messageId ?? 'unknown',
			to,
			accepted: Array.isArray(info?.accepted) ? info.accepted : [],
			rejected: Array.isArray(info?.rejected) ? info.rejected : [],
		});

		return true;
	} catch (error) {
		console.error('❌ Error enviando email:', error);
		return false;
	} finally {
		if (process.env.NODE_ENV === 'production') {
			try {
				await closeTransporter();
			} catch (error) {
				console.error('Error cerrando el transporter:', error);
			}
		}
	}
}

// Limpiar el pool de conexiones al salir
process.on('SIGTERM', () => {
	if (transporter) {
		console.log('🧹 Cerrando pool de conexiones SMTP...');
		void closeTransporter().catch(console.error);
	}
});
