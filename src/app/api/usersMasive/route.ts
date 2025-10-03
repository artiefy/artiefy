import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { userCredentials, users } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';


// 👉 Helper para construir un Excel con Resultados y Resumen
function buildExcelFromResultados(
  resultados: {
    email: string;
    estado: 'GUARDADO' | 'YA_EXISTE' | 'ERROR';
    detalle?: string;
  }[],
  summary: Record<string, unknown>
) {
  const wb = XLSX.utils.book_new();
  const wsResultados = XLSX.utils.json_to_sheet(resultados);
  XLSX.utils.book_append_sheet(wb, wsResultados, 'Resultados');

  const wsResumen = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const excelArrayBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer;
  return Buffer.from(excelArrayBuffer);
}

interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

// Configuración de Nodemailer usando variables de entorno
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'direcciongeneral@artiefy.com',
    pass: process.env.PASS,
  },
});
async function sendExcelWithCredentials(
  data: { correo: string; contraseña: string }[]
) {
  // 1. Crear hoja de Excel
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Credenciales');

  // 2. Convertir a buffer
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'buffer',
  });

  // 3. Enviar correo con adjunto
  await transporter.sendMail({
    from: '"Artiefy" <direcciongeneral@artiefy.com>',
    to: 'lmsg829@gmail.com',
    subject: 'Excel con credenciales de acceso',
    html: `<p>Hola,</p><p>Adjunto encontrarás el archivo con las credenciales.</p>`,
    attachments: [
      {
        filename: 'credenciales.xlsx',
        content: excelBuffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  });

  console.log('✅ Excel enviado a lmsg829@gmail.com');
}

// Función para enviar correo de bienvenida
async function sendWelcomeEmail(
  to: string,
  username: string,
  password: string
) {
  try {
    const mailOptions = {
      from: '"Artiefy" <direcciongeneral@artiefy.com>',
      to,
      subject: '🎨 Bienvenido a Artiefy - Tus Credenciales de Acceso',
      replyTo: 'direcciongeneral@artiefy.com',
      html: `
				<h2>¡Bienvenido a Artiefy, ${username}!</h2>
				<p>Estamos emocionados de tenerte con nosotros. A continuación, encontrarás tus credenciales de acceso:</p>
				<ul>
					<li><strong>Usuario:</strong> ${username}</li>
					<li><strong>Email:</strong> ${to}</li>
					<li><strong>Contraseña:</strong> ${password}</li>
				</ul>
				<p>Por favor, inicia sesión en <a href="https://artiefy.com/" target="_blank">Artiefy</a> y cambia tu contraseña lo antes posible.</p>
				<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
				<hr>
				<p>Equipo de Artiefy 🎨</p>
			`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de bienvenida enviado a ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al enviar correo de bienvenida a ${to}:`, error);
    return false;
  }
}

// 👉 Nueva función para notificar a Secretaría Académica con la lista de usuarios creados
async function sendAcademicNotification(to: string, createdUsers: { firstName: string; lastName: string; email: string; role: string }[]) {
  const subject = `Nuevos usuarios creados – Total: ${createdUsers.length}`;

  const rowsHtml = createdUsers.map(
    (u) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;">${u.firstName} ${u.lastName}</td>
        <td style="padding:6px;border:1px solid #ddd;">${u.email}</td>
        <td style="padding:6px;border:1px solid #ddd;">${u.role}</td>
      </tr>`
  ).join('');

  const html = `
    <h2>Artiefy · Secretaría Académica</h2>
    <p>Se han creado los siguientes usuarios:</p>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <thead>
        <tr style="background:#0B132B;color:#fff;">
          <th style="padding:6px;border:1px solid #ddd;">Nombre</th>
          <th style="padding:6px;border:1px solid #ddd;">Email</th>
          <th style="padding:6px;border:1px solid #ddd;">Rol</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <p style="margin-top:12px;color:#666;font-size:12px;">
      *Este correo es informativo y fue generado automáticamente por Artiefy.
    </p>
  `;

  const text = `
Artiefy · Secretaría Académica – Nuevos usuarios creados

${createdUsers.map((u) => `- ${u.firstName} ${u.lastName} (${u.email}) – ${u.role}`).join('\n')}
  `;

  await transporter.sendMail({
    from: `"Artiefy – Notificaciones" <direcciongeneral@artiefy.com>`,
    to,
    subject,
    html,
    text,
    replyTo: 'direcciongeneral@artiefy.com',
  });
}


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No se proporcionó un archivo válido' },
        { status: 400 }
      );
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const usersData = XLSX.utils.sheet_to_json(sheet) as UserInput[];
    // 👉 log por fila
    const resultados: {
      email: string;
      estado: 'GUARDADO' | 'YA_EXISTE' | 'ERROR';
      detalle?: string;
    }[] = [];

    const successfulUsers: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      status: string;
      isNew: boolean;
    }[] = [];
    const emailErrors: string[] = [];
    const credenciales: { correo: string; contraseña: string }[] = [];

    console.log(`Processing ${usersData.length} users...`);

    for (const userData of usersData) {
      try {
        console.log(`Creating user: ${userData.email}`);
        // 👉 fin de suscripción +1 mes (YYYY-MM-DD)
        const now = new Date();
        const endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        );
        const formattedEndDate = endDate.toISOString().split('T')[0];

        const result = await createUser(
          userData.firstName.trim(),
          userData.lastName.trim(),
          userData.email.trim(),
          userData.role ?? 'estudiante'
        );

        if (!result?.user) {
          console.log(
            `User ${userData.email} already exists, skipping creation`
          );
          resultados.push({ email: userData.email, estado: 'YA_EXISTE' });
          continue;
        }

        const { user: createdUser, generatedPassword } = result;
        credenciales.push({
          correo: userData.email.trim(),
          contraseña: generatedPassword,
        });


        // Always send welcome email, regardless of user creation status
        let emailSent = false;
        for (let attempts = 0; attempts < 3 && !emailSent; attempts++) {
          emailSent = await sendWelcomeEmail(
            userData.email.trim(),
            `${userData.firstName} ${userData.lastName}`.trim(),
            generatedPassword
          );
          if (!emailSent) {
            console.log(
              `Retry ${attempts + 1} sending email to ${userData.email}`
            );
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (!emailSent) {
          emailErrors.push(userData.email);
        }

        // Add user to database, update if exists
        try {
          await db
            .insert(users)
            .values({
              id: createdUser.id,
              name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
              email: userData.email.trim(),
              role: (userData.role ?? 'estudiante') as
                | 'estudiante'
                | 'educador'
                | 'admin'
                | 'super-admin',
              createdAt: new Date(),
              updatedAt: new Date(),
              planType: 'Premium',
              subscriptionEndDate: new Date(formattedEndDate),
            })
            .onConflictDoUpdate({
              target: [users.email, users.role],
              set: {
                name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
                updatedAt: new Date(),
                planType: 'Premium',
                subscriptionEndDate: new Date(formattedEndDate),
              },
            });

          // Update or insert credentials
          try {
            const existingCredentials = await db
              .select()
              .from(userCredentials)
              .where(eq(userCredentials.userId, createdUser.id))
              .limit(1);

            if (existingCredentials.length > 0) {
              // Update existing credentials
              await db
                .update(userCredentials)
                .set({
                  password: generatedPassword,
                  clerkUserId: createdUser.id,
                  email: userData.email.trim(),
                })
                .where(eq(userCredentials.userId, createdUser.id));
            } else {
              // Insert new credentials
              await db.insert(userCredentials).values({
                userId: createdUser.id,
                password: generatedPassword,
                clerkUserId: createdUser.id,
                email: userData.email.trim(),
              });
            }

            successfulUsers.push({
              id: createdUser.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              role: userData.role ?? 'estudiante',
              status: 'activo',
              isNew: true,
            });

            console.log(`✅ User ${userData.email} created successfully`);
            resultados.push({ email: userData.email, estado: 'GUARDADO' });
          } catch (error) {
            console.log(
              `❌ Error updating or inserting user ${userData.email}:`,
              error
            );
            resultados.push({
              email: userData.email,
              estado: 'ERROR',
              detalle: error instanceof Error ? error.message : 'Error DB',
            });

            continue;
          }
        } catch (error) {
          console.log(`❌ Error creating user ${userData.email}:`, error);
          resultados.push({
            email: userData.email,
            estado: 'ERROR',
            detalle: error instanceof Error ? error.message : 'Error creación',
          });

          continue;
        }
      } catch (error) {
        console.log(`❌ Error creating user ${userData.email}:`, error);
        resultados.push({
          email: userData.email,
          estado: 'ERROR',
          detalle: error instanceof Error ? error.message : 'Error desconocido',
        });

        continue;
      }
    }

    const summary = {
      total: usersData.length,
      guardados: resultados.filter((r) => r.estado === 'GUARDADO').length,
      yaExiste: resultados.filter((r) => r.estado === 'YA_EXISTE').length,
      errores: resultados.filter((r) => r.estado === 'ERROR').length,
      emailErrors: emailErrors.length,
    };

    // 👉 Armar payload y buffers para adjuntar y descargar
    const payload = {
      generatedAt: new Date().toISOString(),
      summary,
      resultados,
    };

    // Buffer JSON
    const jsonBuffer = Buffer.from(JSON.stringify(payload, null, 2));

    // Buffer Excel
    const excelBuffer = buildExcelFromResultados(resultados, summary);

    // 👉 Enviar correo con adjuntos al responsable
    await transporter.sendMail({
      from: '"Artiefy" <direcciongeneral@artiefy.com>',
      to: 'lmsg829@gmail.com, direcciontecnologica@ciadet.co',
      subject: 'Reporte de carga masiva de usuarios - Artiefy',
      html: `
    <p>Hola,</p>
    <p>Adjuntamos el resultado de la carga masiva de usuarios.</p>
    <ul>
      <li><strong>Total:</strong> ${summary.total}</li>
      <li><strong>Guardados:</strong> ${summary.guardados}</li>
      <li><strong>Ya existen:</strong> ${summary.yaExiste}</li>
      <li><strong>Errores:</strong> ${summary.errores}</li>
    </ul>
    <p>Se adjuntan <code>resultado.json</code> y <code>resultado.xlsx</code>.</p>
  `,
      attachments: [
        {
          filename: 'resultado.json',
          content: jsonBuffer,
          contentType: 'application/json',
        },
        {
          filename: 'resultado.xlsx',
          content: excelBuffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });
    // al inicio del POST
    await sendExcelWithCredentials(credenciales);
    // 👉 Notificar a Secretaría Académica con la lista de usuarios creados
    await sendAcademicNotification(
      'lmsg829@gmail.com, direcciontecnologica@ciadet.co',
      successfulUsers.map((u) => ({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
      }))
    );



    return NextResponse.json({
      message: 'Proceso completado',
      resultados,
      summary,
      files: {
        jsonBase64: jsonBuffer.toString('base64'),
        excelBase64: excelBuffer.toString('base64'),
        jsonFilename: 'resultado.json',
        excelFilename: 'resultado.xlsx',
        jsonMime: 'application/json',
        excelMime:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export function GET() {
  try {
    // Datos de ejemplo que representarán el formato de la plantilla
    const templateData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        role: 'estudiante', // Puedes omitir o personalizar según el formato requerido
      },
    ];

    // Crear el archivo Excel
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    }) as ArrayBuffer;

    // Retornamos el archivo Excel como respuesta
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=plantilla_usuarios.xlsx',
      },
    });
  } catch (error) {
    console.error('Error al generar la plantilla Excel:', error);
    return NextResponse.json(
      { error: 'Error al generar la plantilla Excel' },
      { status: 500 }
    );
  }
}
