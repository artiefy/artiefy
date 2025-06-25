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
      cc: ['secretaríaacademica@ciadet.co', 'cordinadoracademico@ciadet.co'],
      subject: `Tu suscripción está por vencer${userName ? ` - ${userName}` : ''}`,
      html: `
        <div style="
          min-height:100vh;
          width:100vw;
          padding:0;
          margin:0;
          position:relative;
          background: #01142B url('https://artiefy.com/backcorreo.jpg') no-repeat center center;
          background-size: cover;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        ">
          <div style="width:100%;max-width:600px;margin:0 auto;">
            ${html}
            <div style="margin-top:32px;font-size:0.95rem;color:#888;text-align:center;">
              <hr style="margin:24px 0;border:0;border-top:1px solid #3AF4EF33;" />
              <p>Este correo también fue notificado a administración.<br/>
              <strong>Estudiante:</strong> ${userName || 'Sin nombre'}<br/>
              <strong>Email:</strong> ${to}
              </p>
            </div>
          </div>
        </div>
      `,
      replyTo: 'direcciongeneral@artiefy.com',
      attachments: [
        {
          filename: 'artiefy-logo2.png',
          path: `${process.cwd()}/public/artiefy-logo2.png`,
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
