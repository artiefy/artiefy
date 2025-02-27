import path from 'path';
import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type {
	Options as SMTPTransportOptions,
	SentMessageInfo,
} from 'nodemailer/lib/smtp-transport';
import { EmailTemplateSubscription } from '~/components/estudiantes/layout/EmailTemplateSubscription';

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

const REMINDER_TIMES = {
	BEFORE_2_MIN: 2 * 60 * 1000, // 2 minutos antes (para pruebas)
	BEFORE_7_DAYS: 7 * 24 * 60 * 60 * 1000, // 7 días antes (producción)
	BEFORE_3_DAYS: 3 * 24 * 60 * 60 * 1000, // 3 días antes (producción)
	BEFORE_1_DAY: 24 * 60 * 60 * 1000, // 1 día antes (producción)
};

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

export async function scheduleSubscriptionNotifications(
	email: string,
	expirationDate: Date
): Promise<void> {
	const notificationTimes = [REMINDER_TIMES.BEFORE_2_MIN];

	const notifications = notificationTimes.map(async (timeBeforeExpiration) => {
		const notificationDate = new Date(
			expirationDate.getTime() - timeBeforeExpiration
		);
		const now = new Date();

		if (notificationDate > now) {
			const timeUntilNotification = notificationDate.getTime() - now.getTime();

			console.log(
				`📅 Programando notificación para ${email} en ${timeUntilNotification / 1000}s`
			);

			return new Promise<void>((resolve) => {
				const timer = setTimeout(async () => {
					try {
						const timeLeft = getTimeLeftText(timeBeforeExpiration);
						const formattedDate = expirationDate.toLocaleString('es-ES', {
							timeZone: 'America/Bogota',
						});

						const emailContent = EmailTemplateSubscription({
							userName: email,
							expirationDate: formattedDate,
							timeLeft,
						});

						await sendNotification(
							email,
							'⚠️ Tu suscripción está por expirar - Artiefy',
							emailContent
						);

						console.log(
							`✅ Notificación enviada a ${email} (${timeLeft} antes de expirar)`
						);
					} catch (error) {
						console.error(
							'❌ Error enviando notificación:',
							error instanceof Error ? error.message : 'Unknown error'
						);
					}
					resolve();
				}, timeUntilNotification);

				timer.unref();
			});
		}
		return Promise.resolve();
	});

	await Promise.all(notifications);
}

function getTimeLeftText(milliseconds: number): string {
	const minutes = milliseconds / (1000 * 60);
	const hours = milliseconds / (1000 * 60 * 60);
	const days = milliseconds / (1000 * 60 * 60 * 24);

	if (minutes < 60) return `${Math.round(minutes)} minutos`;
	if (hours < 24) return `${Math.round(hours)} horas`;
	return `${Math.round(days)} días`;
}

// Limpiar el pool de conexiones al salir
process.on('SIGTERM', () => {
	if (transporter) {
		console.log('🧹 Cerrando pool de conexiones SMTP...');
		void closeTransporter().catch(console.error);
	}
});
