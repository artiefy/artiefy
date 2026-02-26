import nodemailer from 'nodemailer';

import { EmailTemplateProjectActivityDue } from '~/components/estudiantes/layout/EmailTemplateProjectActivityDue';

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

interface ProjectActivityDueEmailData {
  to: string;
  userName: string;
  projectName: string;
  activityDescription: string;
  dueDate: string;
  timeLeft: string;
  projectUrl: string;
  objectiveDescription?: string;
}

export async function sendProjectActivityDueEmail(
  emailData: ProjectActivityDueEmailData
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const {
      to,
      userName,
      projectName,
      activityDescription,
      dueDate,
      timeLeft,
      projectUrl,
      objectiveDescription,
    } = emailData;

    if (!process.env.PASS) {
      console.warn(
        '❌ Email no enviado: Falta contraseña en variables de entorno'
      );
      return { success: false, error: { code: 'NO_PASSWORD' } };
    }

    const html = EmailTemplateProjectActivityDue({
      userName,
      projectName,
      activityDescription,
      dueDate,
      timeLeft,
      projectUrl,
      objectiveDescription,
    });

    const mailOptions = {
      from: '"Artiefy Soporte" <direcciongeneral@artiefy.com>',
      to,
      cc: ['secretaríaacademica@ciadet.co', 'cordinadoracademico@ciadet.co'],
      subject: `Entrega pendiente${projectName ? ` - ${projectName}` : ''}`,
      html,
      replyTo: 'direcciongeneral@artiefy.com',
      attachments: [
        {
          filename: 'artiefy-logo2.png',
          path: `${process.cwd()}/public/artiefy-logo2.png`,
          cid: 'logo@artiefy.com',
          contentType: 'image/png',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de actividad pendiente enviado:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de actividad pendiente:', error);
    return { success: false, error };
  }
}
