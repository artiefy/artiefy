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
  attachments?: Array<{
    filename: string;
    path: string;
    cid: string;
    contentType: string;
  }>;
}): Promise<{ success: boolean; error?: EmailError }> {
  try {
    const { to, subject, html, attachments } = emailData;
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
      replyTo: 'direcciongeneral@artiefy.com',
      ...(attachments && { attachments }),
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

interface TicketHistoryComment {
  content: string;
  sender: string;
  senderName: string;
  createdAt: string;
}

export function getTicketHistoryEmail(
  ticketId: number,
  recipientRole: 'student' | 'admin',
  description: string,
  estado: string,
  comments: TicketHistoryComment[]
) {
  const title =
    recipientRole === 'student'
      ? `Actualización en tu Ticket de Soporte #${ticketId}`
      : `Nueva respuesta en Ticket #${ticketId}`;

  const commentsHtml = comments
    .map((comment) => {
      const bgColor =
        comment.sender === 'user'
          ? '#e0f2fe'
          : comment.sender === 'admin'
            ? '#fef3c7'
            : '#f3e8ff';
      const label =
        comment.sender === 'user'
          ? '👤 Estudiante'
          : comment.sender === 'admin'
            ? '👨‍💼 Administrador'
            : '🛠️ Soporte';

      return `
        <div style="margin: 15px 0; padding: 15px; background: ${bgColor}; border-radius: 8px; border-left: 4px solid #2563eb;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #1e40af;">${label}: ${comment.senderName}</strong>
            <span style="font-size: 12px; color: #64748b;">${comment.createdAt}</span>
          </div>
          <p style="margin: 0; color: #334155; white-space: pre-wrap;">${comment.content}</p>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🎫 ${title}</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 20px;">
          
          <!-- Ticket Info -->
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">Información del Ticket</h2>
            <p style="margin: 8px 0;"><strong>ID:</strong> #${ticketId}</p>
            <p style="margin: 8px 0;"><strong>Estado:</strong> <span style="color: #2563eb; font-weight: 600;">${estado}</span></p>
            <p style="margin: 8px 0;"><strong>Descripción:</strong></p>
            <p style="background: #ffffff; padding: 12px; border-radius: 6px; margin: 10px 0; color: #475569;">${description}</p>
          </div>
          
          <!-- Chat History -->
          <div style="margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">📝 Historial de Conversación</h2>
            ${commentsHtml}
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://artiefy.com/${recipientRole === 'student' ? 'estudiantes' : 'dashboard/admin/tickets'}" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
              Ver en Artiefy
            </a>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
            Este es un correo automático de notificación
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} Artiefy - Plataforma Educativa
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}
