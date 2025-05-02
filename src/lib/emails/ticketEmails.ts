import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: 'direcciongeneral@artiefy.com',
		pass: process.env.PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});


interface EmailError {
	code: string;
	command: string;
	response: string;
}

export async function sendTicketEmail(emailData: {
	to: string;
	subject: string;
	html: string;
}): Promise<{ success: boolean; error?: EmailError }> {
	try {
		const { to, subject, html } = emailData;
		console.log('📧 Intentando enviar email a:', to);
		console.log('📧 Asunto:', subject);

		if (!process.env.PASS) {
			console.warn(
				'❌ Email no enviado: Falta contraseña en variables de entorno'
			);
			return {
				success: false,
				error: { code: 'NO_PASSWORD', command: '', response: '' },
			};
		}

		const mailOptions = {
			from: '"Artiefy Support" <direcciongeneral@artiefy.com>',
			to,
			subject,
			html,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('✅ Email enviado exitosamente');
		console.log('📧 ID del mensaje:', info.messageId);
		console.log('📧 Respuesta del servidor:', info.response);
		return { success: true };
	} catch (error) {
		const emailError: EmailError = {
			code: error instanceof Error ? error.message : 'Unknown error',
			command:
				typeof error === 'object' && error !== null && 'command' in error
					? String(error.command)
					: '',
			response:
				typeof error === 'object' && error !== null && 'response' in error
					? String(error.response)
					: '',
		};

		return { success: false, error: emailError };
	}
}

export function getTicketStatusChangeEmail(
	ticketId: number,
	estado: string,
	description: string,
	commentHistory: string,
	newComment?: string
) {
	return `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
			<h2 style="color: #2563eb;">Actualización de Ticket #${ticketId}</h2>
			
			<div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px;">
				<p><strong>Estado actual:</strong> <span style="color: #2563eb;">${estado}</span></p>
				<p><strong>Descripción del ticket:</strong></p>
				<p style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 10px 0;">${description}</p>
			</div>
			
			${
				newComment
					? `
			<div style="margin: 20px 0;">
				<h3 style="color: #2563eb;">Nuevo comentario:</h3>
				<p style="background: #e0f2fe; padding: 12px; border-radius: 6px;">${newComment}</p>
			</div>
			`
					: ''
			}
			
			<div style="margin: 20px 0;">
				<h3 style="color: #2563eb;">Historial de comentarios:</h3>
				<div style="background: #f8fafc; padding: 12px; border-radius: 6px; white-space: pre-line;">
					${commentHistory}
				</div>
			</div>
			
			<p style="margin-top: 30px; font-size: 14px; color: #64748b;">
				Puedes ver más detalles en la plataforma de Artiefy.<br>
				Este es un mensaje automático, por favor no respondas a este correo.
			</p>
		</div>
	`;
}

export function getNewTicketAssignmentEmail(
	ticketId: number,
	description: string
) {
	return `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Nuevo Ticket Asignado #${ticketId}</h2>
            <p>Se te ha asignado un nuevo ticket para revisión.</p>
            <p>Descripción del ticket:</p>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${description}</p>
            <p>Por favor, revisa los detalles en la plataforma de Artiefy.</p>
        </div>
    `;
}
