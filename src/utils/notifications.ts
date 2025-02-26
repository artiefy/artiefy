import path from 'path';
import nodemailer from 'nodemailer';

export async function sendNotification(
	email: string,
	subject: string,
	htmlContent: string
) {
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // true para 465, false para otros puertos
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS, // Usar contraseña de aplicación de Google
		},
		tls: {
			rejectUnauthorized: false, // Necesario en algunos casos
		},
	});

	const mailOptions = {
		from: `"Artiefy" <${process.env.EMAIL_USER}>`, // Nombre personalizado
		to: email,
		subject: subject,
		html: htmlContent,
		attachments: [
			{
				filename: 'artiefy-logo.png',
				path: path.join(process.cwd(), 'public/artiefy-logo2.png'),
				cid: 'logo@artiefy.com',
			},
		],
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log('Correo enviado:', info.messageId);
		return true;
	} catch (error) {
		console.error('Error al enviar correo:', error);
		return false;
	}
}
