import nodemailer from 'nodemailer';
import path from 'path';

export async function sendNotification(email: string, subject: string, htmlContent: string) {
  // Configurar el transportador de nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Puedes usar cualquier servicio de correo compatible con nodemailer
    auth: {
      user: process.env.EMAIL_USER, // Tu dirección de correo electrónico
      pass: process.env.EMAIL_PASS, // Tu contraseña de correo electrónico
    },
  });

  // Configurar las opciones del correo electrónico
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: htmlContent, // Contenido HTML del correo electrónico
    attachments: [
      {
        filename: 'artiefy-logo.png',
        path: path.join(__dirname, '../../public/images/artiefy-logo.png'),
        cid: 'logo@artiefy.com', // Mismo cid que en el src de la imagen en el HTML
      },
    ],
  };

  // Enviar el correo electrónico
  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo electrónico enviado: ' + email);
  } catch (error) {
    console.error('Error al enviar el correo electrónico: ', error);
  }
}
