import { auth, getAuth } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

interface EmailRequestBody {
	content: string;
	recipients: string[];
	forumTitle: string;
	authorName: string;
}

export async function POST(req: Request) {
	try {
		console.log('Starting email send process...');
		const { userId } = auth();

		if (!userId) {
			return NextResponse.json(
				{ error: 'Usuario no autenticado' },
				{ status: 401 }
			);
		}

		// Verificar si el usuario es educador
		const user = await getAuth().getUser(userId);
		if (user.publicMetadata?.role !== 'educador') {
			return NextResponse.json(
				{ error: 'Usuario no autorizado' },
				{ status: 403 }
			);
		}

		// Obtener el token directamente del header de autorización
		const { getToken } = auth();
		const token = await getToken({
			template: 'google_oauth',
		});

		if (!token) {
			return NextResponse.json(
				{ error: 'No se encontró el token de Google' },
				{ status: 400 }
			);
		}

		// Configurar el cliente de OAuth2
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);

		// Establecer las credenciales
		oauth2Client.setCredentials({
			access_token: token,
		});

		const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

		const body = await req.json();
		const { content, recipients, forumTitle, authorName } = body;

		console.log('Preparing email for recipients:', recipients);

		if (!recipients || recipients.length === 0) {
			console.error('No recipients provided');
			return NextResponse.json(
				{ error: 'No recipients provided' },
				{ status: 400 }
			);
		}

		const emailContent = [
			'MIME-Version: 1.0',
			'Content-Type: text/html; charset=utf-8',
			`From: "Sistema de Foros" <${process.env.GMAIL_USER}>`,
			`To: ${recipients.join(', ')}`,
			`Subject: =?utf-8?B?${Buffer.from(
				`Nueva actividad en el foro: ${forumTitle}`
			).toString('base64')}?=`,
			'',
			`
			<div style="font-family: Arial, sans-serif; padding: 20px;">
				<h2>Nueva actividad en el foro: ${forumTitle}</h2>
				<p><strong>${authorName}</strong> (Educador) ha publicado un nuevo mensaje:</p>
				<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
					${content}
				</div>
				<p>Puedes ver y responder a este mensaje accediendo al foro.</p>
				<hr>
				<p style="color: #666; font-size: 12px;">Este es un mensaje automático del sistema de foros. Por favor, no respondas directamente a este correo.</p>
			</div>
			`,
		].join('\r\n');

		console.log('Email content prepared');

		const base64EncodedEmail = Buffer.from(emailContent)
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		const request = {
			userId: 'me',
			requestBody: {
				raw: base64EncodedEmail,
			},
		};

		console.log('Sending email...');

		try {
			const result = await gmail.users.messages.send(request);
			console.log('Email sent successfully:', result.data);
			return NextResponse.json({ success: true, result: result.data });
		} catch (gmailError) {
			console.error('Gmail API Error:', gmailError);
			return NextResponse.json(
				{
					error: 'Error sending email through Gmail API',
					details: gmailError,
					request: request,
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('General error sending email:', error);
		return NextResponse.json(
			{ error: 'Error sending email', details: error },
			{ status: 500 }
		);
	}
}
