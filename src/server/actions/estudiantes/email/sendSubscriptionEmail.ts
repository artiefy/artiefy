import nodemailer from 'nodemailer';

import { EmailTemplateSubscription } from '~/components/estudiantes/layout/EmailTemplateSubscription';

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

interface SubscriptionEmailData {
  to: string;
  userName: string;
  expirationDate: string;
  timeLeft: string;
}

export async function sendSubscriptionEmail(
  emailData: SubscriptionEmailData
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const { to, userName, expirationDate, timeLeft } = emailData;

    if (!process.env.PASS) {
      console.warn(
        '❌ Email no enviado: Falta contraseña en variables de entorno'
      );
      return { success: false, error: { code: 'NO_PASSWORD' } };
    }

    const html = EmailTemplateSubscription({
      userName,
      expirationDate,
      timeLeft,
    });

    const mailOptions = {
      from: '"Artiefy Soporte" <direcciongeneral@artiefy.com>',
      to,
      subject: 'Tu suscripción está por vencer',
      html,
      replyTo: 'direcciongeneral@artiefy.com',
      attachments: [
        {
          filename: 'logo.png',
          path: `${process.cwd()}/public/logo.png`,
          cid: 'logo@artiefy.com',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de suscripción enviado:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de suscripción:', error);
    return { success: false, error };
  }
}
