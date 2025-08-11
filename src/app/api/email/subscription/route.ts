import { NextResponse } from "next/server";

import nodemailer from "nodemailer";

import {
  type EmailTemplateProps,
  EmailTemplateSubscription,
} from "~/components/estudiantes/layout/EmailTemplateSubscription";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "direcciongeneral@artiefy.com",
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as EmailTemplateProps;
    const { to, userName, expirationDate, timeLeft } = data;

    if (!process.env.PASS) {
      return NextResponse.json(
        { error: "Falta contraseña en variables de entorno" },
        { status: 500 },
      );
    }

    const html = EmailTemplateSubscription({
      userName,
      expirationDate,
      timeLeft,
    });

    const mailOptions = {
      from: '"Artiefy" <direcciongeneral@artiefy.com>',
      to,
      subject: "¡Importante! Tu suscripción está por vencer",
      html,
      replyTo: "direcciongeneral@artiefy.com",
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error sending email:", (error as Error)?.message ?? error);
    return NextResponse.json(
      { error: "Error enviando el correo" },
      { status: 500 },
    );
  }
}
