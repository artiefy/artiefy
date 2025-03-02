import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables from .env file
dotenv.config();

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST ?? '',
	port: parseInt(process.env.SMTP_PORT ?? '587', 10),
	secure: false,
	auth: {
		user: process.env.SMTP_USER ?? '',
		pass: process.env.SMTP_PASS ?? '',
	},
});

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
	try {
		const info = await transporter.sendMail({
			from: '"Artiefy" <no-reply@artiefy.com>',
			to,
			subject,
			html,
		});
		console.log('Message sent: %s', info.messageId);
	} catch (error) {
		console.error('Error sending email:', error);
	}
}
