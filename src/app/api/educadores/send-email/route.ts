import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

interface EmailRequestBody {
	content: string;
	recipients: string[];
}

export async function POST(
	req: NextApiRequest & { body: EmailRequestBody },
	res: NextApiResponse
) {
	try {
		console.log('Received email request:', req.body);
		const { sessionClaims } = await auth();

		interface Metadata {
			googleAccessToken?: string;
		}

		const metadata = sessionClaims?.metadata as Metadata;
		const googleAccessToken = metadata?.googleAccessToken;

		if (!googleAccessToken) {
			console.error('Google access token is not available');
			return res
				.status(400)
				.json({ error: 'Google access token is not available' });
		}

		const authClient = new google.auth.OAuth2();
		authClient.setCredentials({
			access_token: googleAccessToken,
		});

		const gmail = google.gmail({ version: 'v1', auth: authClient });

		const { content, recipients } = req.body as EmailRequestBody;

		if (!recipients || recipients.length === 0) {
			console.error('No recipients provided');
			return res.status(400).json({ error: 'No recipients provided' });
		}

		const emailContent = [
			`From: "Me" <me@example.com>`,
			`To: ${recipients.join(', ')}`,
			`Subject: Nuevo mensaje en el foro`,
			'Content-Type: text/html; charset=UTF-8',
			'',
			content,
		].join('\n');

		const base64EncodedEmail = Buffer.from(emailContent)
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');

		const request = {
			userId: 'me',
			requestBody: {
				raw: base64EncodedEmail,
			},
		};

		console.log('Sending email with content:', emailContent);
		const result = await gmail.users.messages.send(request);

		console.log('Email sent result:', result);
		return res.status(200).json({ success: true, result });
	} catch (error) {
		console.error('Error sending email:', error);
		return res.status(500).json({ error: 'Error sending email' });
	}
}
