import { type NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';



// 📌 Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'direcciongeneral@artiefy.com',
    pass: 'hszz cilc otvj dlpb' // ⚠️ Usa variables de entorno en producción
  }
});

// 📌 Función para enviar correos
async function sendEmail({
  to,
  subject,
  html,
  attachments = []
}: {
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}): Promise<{ success: boolean; message: string }> {
  try {
    const mailOptions = {
      from: `"Artiefy" <direcciongeneral@artiefy.com>`,
      to: to.join(','), // 📩 Enviar a múltiples correos
      subject,
      html,
      attachments
    };

    console.log('📩 Enviando con Nodemailer:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado correctamente: ${info.messageId}`);

    return { success: true, message: 'Correo enviado correctamente' };
  } catch (error: unknown) {
    console.error('❌ Error al enviar el correo:', error);
    return { success: false, message: `Error al enviar el correo: ${(error as Error).message}` };
  }
}

// 📌 API de Next.js para manejar los correos
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    console.log('📌 FormData recibido en backend:', [...formData.entries()]);

    // 🔹 Extraer datos
    const subject = formData.get('subject') as string | null;
    const message = formData.get('message') as string | null;
    const emailsRaw = formData.getAll('emails[]');

    if (!subject || !message || emailsRaw.length === 0) {
      console.error('❌ Error: Faltan datos requeridos');
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // 📌 Convertir emails a un array de strings
    const emails: string[] = emailsRaw.map(email =>
      typeof email === 'string' ? email.trim() : ''
    );

    console.log('📧 Correos a enviar:', emails);

    // 📌 Manejo de archivos adjuntos
    const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];
    for (const entry of formData.entries()) {
      const [key, value] = entry;

      if (value instanceof Blob) {
        const buffer = Buffer.from(await value.arrayBuffer());
        attachments.push({
          filename: key,
          content: buffer,
          contentType: value.type
        });
      }
    }

    console.log(`📌 Se adjuntaron ${attachments.length} archivos`);

    const result = await sendEmail({ to: emails, subject, html: message, attachments });
    
    console.log('📩 Resultado final:', result);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('❌ Error en API de correo:', error);
    return NextResponse.json({ error: `Error interno del servidor: ${(error as Error).message}` }, { status: 500 });
  }
}


// 📌 **GET para obtener usuarios desde la base de datos**
export async function GET(): Promise<NextResponse> {
  try {
    const userList = await db
      .selectDistinct({ id: users.id, name: users.name, email: users.email })
      .from(users);

    console.log('📌 Usuarios obtenidos:', userList);
    return NextResponse.json(userList);
  } catch (error) {
    console.error('❌ Error al obtener los usuarios:', error);
    return NextResponse.json({ error: 'Error al obtener los usuarios' }, { status: 500 });
  }
}

