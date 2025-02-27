interface EmailTemplateProps {
	userName: string;
	message: string;
}

const styles = {
	container: [
		'font-family: Arial, sans-serif',
		'max-width: 600px',
		'margin: auto',
		'padding: 20px',
		'border: 1px solid #ddd',
		'border-radius: 10px',
		'background-color: #ffffff',
	].join(';'),

	header: ['text-align: center', 'margin-bottom: 24px'].join(';'),

	logo: ['max-width: 150px', 'margin-bottom: 20px'].join(';'),

	title: ['color: #333333', 'font-size: 24px', 'margin-bottom: 16px'].join(';'),

	message: [
		'color: #555555',
		'font-size: 16px',
		'line-height: 1.5',
		'margin-bottom: 24px',
	].join(';'),

	footer: [
		'color: #555555',
		'font-size: 14px',
		'margin-top: 32px',
		'padding-top: 16px',
		'border-top: 1px solid #eeeeee',
	].join(';'),
};

export function EmailTemplate({ userName, message }: EmailTemplateProps) {
	const template = [
		'<!DOCTYPE html>',
		'<html lang="es">',
		'<head>',
		'<meta charset="UTF-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
		'<title>Notificación de Artiefy</title>',
		'</head>',
		'<body style="margin: 0; padding: 0; background-color: #f5f5f5;">',
		`<div style="${styles.container}">`,
		`<div style="${styles.header}">`,
		`<img src="cid:logo@artiefy.com" alt="Artiefy Logo" style="${styles.logo}"/>`,
		'</div>',
		`<h2 style="${styles.title}">Hola, ${userName}</h2>`,
		`<div style="${styles.message}">${message}</div>`,
		`<div style="${styles.footer}">`,
		'<p>Gracias por ser parte de nuestra plataforma.</p>',
		'<p>Saludos,<br/>El equipo de Artiefy</p>',
		'</div>',
		'</div>',
		'</body>',
		'</html>',
	].join('');

	return template;
}
