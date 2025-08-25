import { sendEmail } from './index';

interface CalendarEventOptions {
  to: string;
  eventDetails: string;
}

export async function sendCalendarEvent({
  to,
  eventDetails,
}: CalendarEventOptions) {
  const subject = 'New Calendar Event';
  const html = `
		<p>You have a new calendar event:</p>
		<p>${eventDetails}</p>
	`;
  await sendEmail({ to, subject, html });
}
