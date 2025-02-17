import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

interface EmailRequestBody {
	content: string;
	recipients: string[];
	forumTitle: string;
	authorName: string;
}

export async function POST(req: Request) {
	try {
		console.log('Starting email send process...');
		const { sessionClaims } = await auth();
		const body = await req.json();
		console.log('Request body:', body);

		interface Metadata {
			googleAccessToken?: string;
		}

		const metadata = sessionClaims?.metadata as Metadata;
		const googleAccessToken = metadata?.googleAccessToken;

		if (!googleAccessToken) {
			console.error('Google access token is not available');
			return NextResponse.json(
				{ error: 'Google access token is not available' },
				{ status: 400 }
			);
		}

		console.log('Google token available:', !!googleAccessToken);

		const authClient = new google.auth.OAuth2();
		authClient.setCredentials({
			access_token: googleAccessToken,
		});

		const gmail = google.gmail({ version: 'v1', auth: authClient });

		const { content, recipients, forumTitle, authorName } =
			body as EmailRequestBody;

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
				<p><strong>${authorName}</strong> ha publicado un nuevo mensaje:</p>
				<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
					${content}
				</div>
				<p>Puedes ver y responder a este mensaje accediendo al foro.</p>
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
					request: request 
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
