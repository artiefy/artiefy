export function generateCalendarEvent(expirationDate: Date): string {
	const now = new Date();
	const alarmTime = new Date(expirationDate.getTime() - 2 * 60 * 1000); // 2 minutos antes

	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Artiefy//Subscription//ES',
		'METHOD:REQUEST',
		'BEGIN:VEVENT',
		`DTSTART:${formatDate(alarmTime)}`,
		`DTEND:${formatDate(expirationDate)}`,
		`DTSTAMP:${formatDate(now)}`,
		'SUMMARY:Tu suscripción de Artiefy está por expirar',
		'DESCRIPTION:Tu suscripción expirará en 2 minutos. Por favor renueva tu plan.',
		'BEGIN:VALARM',
		'ACTION:DISPLAY',
		'DESCRIPTION:Recordatorio: Tu suscripción está por expirar',
		'TRIGGER:-PT2M',
		'END:VALARM',
		'PRIORITY:1',
		'CLASS:PUBLIC',
		'END:VEVENT',
		'END:VCALENDAR',
	].join('\r\n');
}

function formatDate(date: Date): string {
	return date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');
}
