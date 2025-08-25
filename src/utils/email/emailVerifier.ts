import { sendEmail } from './index';

interface VerificationEmailOptions {
  to: string;
  verificationLink: string;
}

export async function sendVerificationEmail({
  to,
  verificationLink,
}: VerificationEmailOptions) {
  const subject = 'Verify your email address';
  const html = `
		<p>Please verify your email address by clicking the link below:</p>
		<a href="${verificationLink}">Verify Email</a>
	`;
  await sendEmail({ to, subject, html });
}
