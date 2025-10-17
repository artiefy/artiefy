import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { userCredentials, users } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

// Runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 300;

// Utilidades de saneo/validación
const safeTrim = (v?: string) => (typeof v === 'string' ? v.trim() : '');
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

// Tipos para errores de Clerk
interface ClerkErrorItem {
  message?: string;
  longMessage?: string;
}

interface ClerkError {
  errors?: ClerkErrorItem[];
  clerkError?: boolean;
  status?: number;
  message?: string;
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
  try {
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
  } catch (error) {
    console.error('❌ Error enviando Excel de credenciales:', error);
  }
}

// Función para enviar correo de bienvenida
async function sendWelcomeEmail(
  to: string,
  username: string,
  password: string
): Promise<boolean> {
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
async function sendAcademicNotification(
  to: string,
  createdUsers: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }[]
): Promise<void> {
  try {
    const subject = `Nuevos usuarios creados – Total: ${createdUsers.length}`;
    const rowsHtml = createdUsers
      .map(
        (u) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;">${u.firstName} ${u.lastName}</td>
        <td style="padding:6px;border:1px solid #ddd;">${u.email}</td>
        <td style="padding:6px;border:1px solid #ddd;">${u.role}</td>
      </tr>`
      )
      .join('');
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
  } catch (error) {
    console.error('❌ Error enviando notificación académica:', error);
  }
}

// 👉 Helper para extraer mensaje de error detallado de Clerk
function getClerkErrorMessage(error: unknown): string {
  const clerkError = error as ClerkError;

  if (
    clerkError?.errors &&
    Array.isArray(clerkError.errors) &&
    clerkError.errors.length > 0
  ) {
    return clerkError.errors
      .map((e: ClerkErrorItem) => e.message ?? e.longMessage ?? 'Error')
      .join(', ');
  }

  if (clerkError?.clerkError) {
    return `Clerk Error ${clerkError.status ?? ''}: ${clerkError.message ?? 'Forbidden'}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido';
}

// 👉 Delay entre requests para evitar rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];

      // Validación y sanitización al inicio del loop
      const firstName = safeTrim(userData.firstName);
      const lastName = safeTrim(userData.lastName);
      const email = safeTrim(userData.email);
      const role = safeTrim(userData.role) ?? 'estudiante';

      // Validación dura (no frena el loop)
      if (!firstName || !lastName || !email) {
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: 'Campos obligatorios faltantes (firstName, lastName o email)',
        });
        continue;
      }

      if (!isValidEmail(email)) {
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: 'Email inválido',
        });
        continue;
      }

      // (Opcional) paso/etapa para aclarar el motivo de falla
      let step = 'init';

      try {
        console.log(`[${i + 1}/${usersData.length}] Processing user: ${email}`);

        // 👉 Pequeño delay entre usuarios para evitar rate limits (opcional)
        if (i > 0 && i % 10 === 0) {
          console.log(
            `⏳ Pausa de 2s después de 10 usuarios para evitar rate limits...`
          );
          await delay(2000);
        }

        // 👉 fin de suscripción +1 mes (YYYY-MM-DD)
        const now = new Date();
        const endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        );
        const formattedEndDate = endDate.toISOString().split('T')[0];

        step = 'createUser';
        let result;

        try {
          result = await createUser(firstName, lastName, email, role);
        } catch (clerkError: unknown) {
          const errorMsg = getClerkErrorMessage(clerkError);
          console.log(`❌ Error Clerk [${email}]: ${errorMsg}`);

          const clerkErrObj = clerkError as ClerkError;

          // Si es 403 Forbidden, probablemente es rate limit o permisos
          if (clerkErrObj?.status === 403) {
            resultados.push({
              email,
              estado: 'ERROR',
              detalle: `Clerk Forbidden (403): ${errorMsg}. Verifica permisos de API o límites de creación`,
            });
          } else {
            resultados.push({
              email,
              estado: 'ERROR',
              detalle: `createUser: ${errorMsg}`,
            });
          }

          continue;
        }

        if (!result?.user) {
          console.log(`User ${email} already exists, skipping creation`);
          resultados.push({ email, estado: 'YA_EXISTE' });
          continue;
        }

        const { user: createdUser, generatedPassword } = result;

        credenciales.push({
          correo: email,
          contraseña: generatedPassword,
        });

        // Add user to database, update if exists
        try {
          step = 'dbTransaction';

          await db.transaction(async (tx) => {
            await tx
              .insert(users)
              .values({
                id: createdUser.id,
                name: `${firstName} ${lastName}`,
                email,
                role: role as
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
                target: users.email,
                set: {
                  name: `${firstName} ${lastName}`,
                  updatedAt: new Date(),
                  planType: 'Premium',
                  subscriptionEndDate: new Date(formattedEndDate),
                },
              });

            step = 'userCredentialsUpsert';

            const existingCredentials = await tx
              .select()
              .from(userCredentials)
              .where(eq(userCredentials.userId, createdUser.id))
              .limit(1);

            if (existingCredentials.length > 0) {
              await tx
                .update(userCredentials)
                .set({
                  password: generatedPassword,
                  clerkUserId: createdUser.id,
                  email,
                })
                .where(eq(userCredentials.userId, createdUser.id));
            } else {
              await tx.insert(userCredentials).values({
                userId: createdUser.id,
                password: generatedPassword,
                clerkUserId: createdUser.id,
                email,
              });
            }
          });

          successfulUsers.push({
            id: createdUser.id,
            firstName,
            lastName,
            email,
            role,
            status: 'activo',
            isNew: true,
          });

          console.log(`✅ User ${email} created successfully`);
          resultados.push({ email, estado: 'GUARDADO' });

          // Enviar bienvenida SOLO cuando DB quedó OK
          {
            step = 'sendWelcomeEmail';
            const fullName = `${firstName} ${lastName}`.trim();
            let emailSent = false;

            for (let attempts = 0; attempts < 3 && !emailSent; attempts++) {
              emailSent = await sendWelcomeEmail(
                email,
                fullName,
                generatedPassword
              );

              if (!emailSent) {
                console.log(`Retry ${attempts + 1} sending email to ${email}`);
                await delay(1000);
              }
            }

            if (!emailSent) emailErrors.push(email);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Error DB';
          console.log(`❌ Error [${step}] ${email}:`, msg);
          resultados.push({
            email,
            estado: 'ERROR',
            detalle: `${step}: ${msg}`,
          });
          continue;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        console.log(`❌ Error [${step}] ${email}:`, msg);
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: `${step}: ${msg}`,
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

    // 👉 Envíos finales en paralelo y tolerantes a fallos
    await Promise.allSettled([
      transporter.sendMail({
        from: '"Artiefy" <direcciongeneral@artiefy.com>',
        to: 'lmsg829@gmail.com',
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
      }),
      sendExcelWithCredentials(credenciales),
      sendAcademicNotification(
        'lmsg829@gmail.com',
        successfulUsers.map((u) => ({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
        }))
      ),
    ]);

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
        role: 'estudiante',
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