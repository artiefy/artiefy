import { NextResponse } from "next/server";

import nodemailer from "nodemailer";

// Tipado del cuerpo de la petición
interface EmailRequestBody {
  content: string;
  recipients: string[];
  forumTitle: string;
  authorName: string;
}

// Configuración de Nodemailer con Gmail institucional
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "direcciongeneral@artiefy.com",
    pass: process.env.PASS, // App Password en .env
  },
});

// API Handler
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EmailRequestBody;
    const { content, recipients, forumTitle, authorName } = body;

    // Validación
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "No se especificaron destinatarios" },
        { status: 400 },
      );
    }

    const mailOptions = {
      from: '"Foros Artiefy" <direcciongeneral@artiefy.com>',
      to: recipients.join(","),
      subject: `📢 Nueva actividad en el foro: ${forumTitle}`,
      replyTo: "direcciongeneral@artiefy.com",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Nueva actividad en el foro: ${forumTitle}</h2>
          <p><strong>${authorName}</strong> escribió:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${content}
          </div>
          <p>Puedes responder accediendo al foro en Artiefy.</p>
          <hr />
          <p style="color: #888; font-size: 12px;">Este es un mensaje automático del sistema de foros. No respondas directamente a este correo.</p>
        </div>
      `,
    };

    // Envío
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Correo enviado correctamente",
    });
  } catch (error) {
    console.error("Error al enviar el correo del foro:", error);
    return NextResponse.json(
      { error: "Error interno al enviar el correo" },
      { status: 500 },
    );
  }
}
