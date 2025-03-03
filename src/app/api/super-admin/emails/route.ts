import { NextRequest, NextResponse } from 'next/server';
import { MailerSend, EmailParams } from 'mailersend';
import { db } from '~/server/db';  // Asumiendo que tienes un DB configurado en tu proyecto
import { users } from '~/server/db/schema'; // Asumiendo que tienes un esquema de usuario en tu base de datos

// Configuración correcta de MailerSend
const mailerSend = new MailerSend({
  apiKey: 'mlsn.617fdd174eb3921b47d50ae4622c4c6a4c0f21c871ada0a8f2090fdc291aef68'  // Tu API Key de MailerSend
});

// Función para enviar el correo usando MailerSend
async function sendEmail({ subject, message, emails }: { subject: string; message: string; emails: string[] }): Promise<{ success: boolean; message: string }> {
  try {
    // Validar los parámetros
    if (!subject || !message || !emails.length) {
      throw new Error('Todos los campos son obligatorios');
    }

    const emailParams = new EmailParams()
      .setFrom({ email: 'your-email@example.com', name: 'Your Name' }) // Correo de origen (reemplazar con tu correo real)
      .setTo(emails.map(email => ({ email }))) // Correos de destino
      .setSubject(subject)
      .setHtml(message); // Contenido del mensaje

    const response = await mailerSend.email.send(emailParams);
    return { success: true, message: 'Correo enviado exitosamente' };
  } catch (error: unknown) {
    console.error('❌ Error al enviar el correo:', error);
    throw new Error('Error al enviar el correo');
  }
}

// 📌 **GET para obtener usuarios desde la base de datos**
export async function GET(): Promise<NextResponse> {
  try {
    // Obtener usuarios distintos desde la base de datos
    const userList = await db
      .selectDistinct({ id: users.id, name: users.name, email: users.email })
      .from(users);

    return NextResponse.json(userList);
  } catch (error) {
    console.error('❌ Error al obtener los usuarios:', error);
    return NextResponse.json({ error: 'Error al obtener los usuarios' }, { status: 500 });
  }
}

// 📌 **POST para enviar el correo**
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Log para verificar el cuerpo de la solicitud antes de procesarlo
    console.log('🚨 Cuerpo de la solicitud recibido:', req);

    // Verificamos que el cuerpo de la solicitud sea JSON válido
    let body: { subject: string; message: string; emails: string[] } | null = null;
    try {
      body = await req.json() as { subject: string; message: string; emails: string[] };
    } catch (jsonError) {
      console.error('❌ Error al analizar JSON:', jsonError);
      return NextResponse.json({ error: 'Cuerpo de la solicitud no es válido' }, { status: 400 });
    }

    // Verificación de que los campos no están vacíos
    const { subject, message, emails } = body;
    if (!subject || !message || emails.length === 0) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // Enviar el correo utilizando MailerSend
    const result: { success: boolean; message: string } = await sendEmail({ subject, message, emails });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
