import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { userCredentials, users } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

// Runtime configuration
export const maxDuration = 300;
void userCredentials;

// Utilidades de validación
const safeTrim = (v?: string | null) => (typeof v === 'string' ? v.trim() : '');
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper para construir Excel con Resultados y Resumen
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
  phone?: string;
  document?: string;
  identificacionNumero?: string;
  [key: string]: string | undefined;
}

interface ColumnMapping {
  excelColumn: string;
  dbField: string;
}

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

interface ClerkUser {
  id: string;
}

interface ClerkUsersResponse {
  data?: ClerkUser[];
}

interface CreateUserResponse {
  user: ClerkUser;
  generatedPassword: string;
}

interface PendingEmail {
  email: string;
  fullName: string;
  password: string;
}

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'direcciongeneral@artiefy.com',
    pass: process.env.PASS,
  },
});

// Delay entre requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Enviar Excel con credenciales
async function sendExcelWithCredentials(
  data: { correo: string; contraseña: string }[]
): Promise<void> {
  if (data.length === 0) {
    console.log('⚠️ No hay credenciales para enviar');
    return;
  }

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Credenciales');
    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'buffer',
    });

    await transporter.sendMail({
      from: '"Artiefy" <direcciongeneral@artiefy.com>',
      to: 'lmsg829@gmail.com',
      subject: 'Excel con credenciales de acceso',
      html: `<p>Hola,</p><p>Adjunto encontrarás el archivo con las credenciales de ${data.length} usuario(s) nuevo(s).</p>`,
      attachments: [
        {
          filename: 'credenciales.xlsx',
          content: excelBuffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });
    console.log(`✅ Excel de credenciales enviado (${data.length} usuarios)`);
  } catch (error) {
    console.error('❌ Error enviando Excel de credenciales:', error);
  }
}

// Enviar correo de bienvenida
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

// Enviar correos por lotes con delays
async function sendWelcomeEmailsBatch(
  emailQueue: PendingEmail[],
  emailErrors: string[]
): Promise<void> {
  console.log(
    `📧 Enviando ${emailQueue.length} correos de bienvenida por lotes...`
  );

  for (let i = 0; i < emailQueue.length; i++) {
    const { email, fullName, password } = emailQueue[i];

    // Delay entre cada correo (3 segundos)
    if (i > 0) {
      await delay(3000);
    }

    // Delay más largo cada 10 correos (30 segundos)
    if (i > 0 && i % 10 === 0) {
      console.log(
        `⏳ Pausa de 30s cada 10 correos... (${i}/${emailQueue.length})`
      );
      await delay(30000);
    }

    console.log(`📤 Enviando correo ${i + 1}/${emailQueue.length} a ${email}`);

    try {
      let emailSent = false;

      // Intentar enviar hasta 3 veces
      for (let attempts = 0; attempts < 3 && !emailSent; attempts++) {
        if (attempts > 0) {
          console.log(`⏳ Reintento ${attempts} para ${email}`);
          await delay(2000);
        }
        emailSent = await sendWelcomeEmail(email, fullName, password);
      }

      if (!emailSent) {
        emailErrors.push(email);
        console.error(
          `❌ No se pudo enviar email a ${email} después de 3 intentos`
        );
      }
    } catch (error) {
      emailErrors.push(email);
      console.error(`❌ Error crítico enviando a ${email}:`, error);
    }
  }

  console.log(
    `✅ Proceso de envío de correos completado. Exitosos: ${emailQueue.length - emailErrors.length}/${emailQueue.length}`
  );
}

// Notificar a Secretaría Académica y Dirección Tecnológica
async function sendAcademicNotification(
  createdUsers: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }[]
): Promise<void> {
  if (createdUsers.length === 0) {
    console.log('⚠️ No hay usuarios para notificar a Secretaría Académica');
    return;
  }

  try {
    const recipients = [
      'secretariaacademica@ciadet.co',
      'direcciontecnologica@ciadet.co',
    ];

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
      from: '"Artiefy – Notificaciones" <direcciongeneral@artiefy.com>',
      to: recipients.join(', '),
      subject,
      html,
      text,
      replyTo: 'direcciongeneral@artiefy.com',
    });

    console.log(
      `✅ Notificación académica enviada a: ${recipients.join(', ')}`
    );
  } catch (error) {
    console.error('❌ Error enviando notificación académica:', error);
  }
}

// Extraer mensaje de error de Clerk
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

// Buscar usuario en Clerk por email
async function getClerkUserByEmail(email: string): Promise<ClerkUser | null> {
  const apiKey = process.env.CLERK_SECRET_KEY;
  if (!apiKey) {
    throw new Error('Falta CLERK_SECRET_KEY en variables de entorno');
  }

  const url = `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Clerk lookup failed (${res.status}): ${errorText}`);
    }

    const json = (await res.json()) as ClerkUser[] | ClerkUsersResponse;

    const arr: ClerkUser[] = Array.isArray(json)
      ? json
      : Array.isArray((json as ClerkUsersResponse).data)
        ? ((json as ClerkUsersResponse).data ?? [])
        : [];

    return arr.length > 0 ? arr[0] : null;
  } catch (error) {
    console.error(`Error buscando usuario ${email} en Clerk:`, error);
    throw error;
  }
}

// Type guard para verificar si es CreateUserResponse
function isCreateUserResponse(result: unknown): result is CreateUserResponse {
  return (
    typeof result === 'object' &&
    result !== null &&
    'user' in result &&
    typeof (result as CreateUserResponse).user === 'object' &&
    (result as CreateUserResponse).user !== null
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mappingsJson = formData.get('mappings');
    const previewOnly = formData.get('previewOnly') === 'true';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No se proporcionó un archivo válido' },
        { status: 400 }
      );
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        { error: 'El archivo Excel no contiene hojas válidas' },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'El archivo Excel está vacío' },
        { status: 400 }
      );
    }

    // Si es solo preview, devolver las columnas detectadas
    if (previewOnly || !mappingsJson) {
      const firstRow = rawData[0] as Record<string, unknown>;
      const detectedColumns = Object.keys(firstRow);

      return NextResponse.json({
        preview: true,
        columns: detectedColumns,
        rowCount: rawData.length,
        sampleData: rawData.slice(0, 5),
      });
    }

    const mappings: ColumnMapping[] = JSON.parse(mappingsJson as string);

    // Mapear datos según las columnas seleccionadas
    const usersData = rawData.map((row) => {
      const mappedRow: Record<string, unknown> = {};
      mappings.forEach(({ excelColumn, dbField }) => {
        const value = (row as Record<string, unknown>)[excelColumn];
        let stringValue = '';
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            stringValue = JSON.stringify(value);
          } else if (typeof value === 'string') {
            stringValue = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            stringValue = String(value);
          } else {
            stringValue = JSON.stringify(value);
          }
          stringValue = stringValue.trim();
        }
        mappedRow[dbField] = stringValue;
      });
      return mappedRow;
    }) as UserInput[];

    if (usersData.length === 0) {
      return NextResponse.json(
        { error: 'El archivo Excel está vacío' },
        { status: 400 }
      );
    }

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
    const emailQueue: PendingEmail[] = [];
    const whatsappQueue: { phone: string; name: string }[] = [];

    console.log(`📊 Procesando ${usersData.length} usuarios...`);

    // FASE 1: Procesar usuarios (sin enviar correos individuales)
    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];

      // Sanitización
      const firstName = safeTrim(userData.firstName);
      const lastName = safeTrim(userData.lastName);
      const email = safeTrim(userData.email).toLowerCase();
      // Rol explícito de la fila; si viene vacío, para un usuario NUEVO se
      // asume 'estudiante', pero para uno EXISTENTE no se toca su rol actual
      // (evita que una carga sin columna de rol degrade a un educador/admin).
      const providedRole = safeTrim(userData.role);
      const role = providedRole || 'estudiante';
      const phone = safeTrim(userData.phone);
      const documentNumber = safeTrim(
        userData.document ?? userData.identificacionNumero
      );

      console.log(`[${i + 1}/${usersData.length}] 📝 Procesando ${email}:`, {
        firstName,
        lastName,
        phone: phone || 'SIN TELÉFONO',
        document: documentNumber || 'SIN DOCUMENTO',
        role,
      });

      // Validación de campos obligatorios
      if (!firstName || !lastName || !email) {
        resultados.push({
          email: email || `fila_${i + 1}`,
          estado: 'ERROR',
          detalle:
            'Campos obligatorios faltantes (firstName, lastName o email)',
        });
        continue;
      }

      // Validación de email
      if (!isValidEmail(email)) {
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: 'Formato de email inválido',
        });
        continue;
      }

      // Validación de rol (solo si la fila trae un rol explícito)
      const validRoles = ['estudiante', 'educador', 'admin', 'super-admin'];
      if (providedRole && !validRoles.includes(role)) {
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: `Rol inválido: ${role}. Roles válidos: ${validRoles.join(', ')}`,
        });
        continue;
      }

      let step = 'init';

      try {
        // Delay cada 10 usuarios para evitar rate limits de Clerk
        if (i > 0 && i % 10 === 0) {
          console.log('⏳ Pausa de 2s para evitar rate limits de Clerk...');
          await delay(2000);
        }

        // Calcular fecha de fin de suscripción
        const now = new Date();
        const endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        );
        const formattedEndDate = endDate.toISOString().split('T')[0];

        step = 'createUser';
        let isNewInClerk = false;
        let clerkUser: ClerkUser | null = null;
        let generatedPassword: string | null = null;

        try {
          const result = await createUser(firstName, lastName, email, role);

          if (isCreateUserResponse(result)) {
            isNewInClerk = true;
            clerkUser = result.user;
            generatedPassword = result.generatedPassword ?? null;
          } else {
            clerkUser = await getClerkUserByEmail(email);
          }
        } catch (clerkError: unknown) {
          const errorMsg = getClerkErrorMessage(clerkError);
          console.log(`⚠️ Error Clerk para ${email}: ${errorMsg}`);
          const clerkErrObj = clerkError as ClerkError;

          const probablyExists =
            [409, 422].includes(clerkErrObj?.status ?? 0) ||
            /already\s*exist/i.test(errorMsg) ||
            /identifier.*in\s*use/i.test(errorMsg) ||
            /email.*taken/i.test(errorMsg);

          if (probablyExists) {
            step = 'syncExistingUser';
            clerkUser = await getClerkUserByEmail(email);

            if (!clerkUser) {
              resultados.push({
                email,
                estado: 'ERROR',
                detalle:
                  'El usuario existe en Clerk pero no se pudo obtener su información',
              });
              continue;
            }
          } else {
            if (clerkErrObj?.status === 403) {
              resultados.push({
                email,
                estado: 'ERROR',
                detalle:
                  'Clerk: Acceso denegado (403). Verifica permisos de API',
              });
            } else {
              resultados.push({
                email,
                estado: 'ERROR',
                detalle: `Clerk: ${errorMsg}`,
              });
            }
            continue;
          }
        }

        if (!clerkUser) {
          resultados.push({
            email,
            estado: 'ERROR',
            detalle: 'No se pudo obtener o crear usuario en Clerk',
          });
          continue;
        }

        step = 'dbUpsertUser';

        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          await db
            .update(users)
            .set({
              name: `${firstName} ${lastName}`,
              // Solo se pisa el rol si la fila lo trajo explícito; si no,
              // se conserva el rol que el usuario ya tenía.
              ...(providedRole
                ? {
                    role: role as
                      'estudiante' | 'educador' | 'admin' | 'super-admin',
                  }
                : {}),
              updatedAt: new Date(),
              planType: 'Premium',
              subscriptionEndDate: new Date(formattedEndDate),
              phone: phone || null,
              identificacionNumero: documentNumber || null,
              document: documentNumber || null,
            })
            .where(eq(users.id, existingUser[0].id));

          console.log(
            `✅ Usuario actualizado: ${email} | Teléfono: ${phone || 'N/A'} | Documento: ${documentNumber || 'N/A'}`
          );
        } else {
          await db.insert(users).values({
            id: clerkUser.id,
            name: `${firstName} ${lastName}`,
            email,
            role: role as 'estudiante' | 'educador' | 'admin' | 'super-admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            planType: 'Premium',
            subscriptionEndDate: new Date(formattedEndDate),
            phone: phone || null,
            identificacionNumero: documentNumber || null,
            document: documentNumber || null,
          });

          console.log(
            `✅ Usuario insertado en BD: ${email} - phone: ${phone}, doc: ${documentNumber}`
          );
        }

        successfulUsers.push({
          id: clerkUser.id,
          firstName,
          lastName,
          email,
          role,
          status: 'activo',
          isNew: isNewInClerk,
        });

        resultados.push({
          email,
          estado: isNewInClerk ? 'GUARDADO' : 'YA_EXISTE',
          detalle: isNewInClerk
            ? undefined
            : 'Usuario ya existía en Clerk, sincronizado en BD',
        });

        // Agregar a la cola de correos (no enviar todavía)
        if (isNewInClerk && generatedPassword) {
          credenciales.push({ correo: email, contraseña: generatedPassword });
          emailQueue.push({
            email,
            fullName: `${firstName} ${lastName}`.trim(),
            password: generatedPassword,
          });
        }
        const trimmedPhone = phone?.trim();

        if (trimmedPhone) {
          whatsappQueue.push({
            phone: trimmedPhone,
            name: `${firstName} ${lastName}`.trim(),
          });
        }
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Error [${step}] para ${email}:`, msg);
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: `${step}: ${msg}`,
        });
      }
    }

    console.log('✅ Fase 1 completada: Todos los usuarios procesados');

    // FASE 2: Enviar correos por lotes
    if (emailQueue.length > 0) {
      console.log(
        `\n📧 Fase 2: Enviando ${emailQueue.length} correos de bienvenida...`
      );
      await sendWelcomeEmailsBatch(emailQueue, emailErrors);
    }

    // FASE 2.5: Enviar plantillas de WhatsApp
    if (whatsappQueue.length > 0) {
      console.log(
        `\n📱 Fase 2.5: Enviando ${whatsappQueue.length} plantillas de WhatsApp...`
      );

      for (let i = 0; i < whatsappQueue.length; i++) {
        const { phone } = whatsappQueue[i];

        // Delay entre cada mensaje (2 segundos)
        if (i > 0) {
          await delay(2000);
        }

        // Delay más largo cada 5 mensajes (10 segundos)
        if (i > 0 && i % 5 === 0) {
          console.log(
            `⏳ Pausa de 10s cada 5 mensajes... (${i}/${whatsappQueue.length})`
          );
          await delay(10000);
        }

        console.log(
          `📤 Enviando WhatsApp ${i + 1}/${whatsappQueue.length} a ${phone}`
        );

        try {
          const waResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/super-admin/whatsapp`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: phone,
                forceTemplate: true,
                templateName: 'binvenida_creacion_de_usuario',
                languageCode: 'es',
                session: 'soporte',
              }),
            }
          );

          if (waResponse.ok) {
            console.log(`✅ WhatsApp enviado exitosamente a ${phone}`);
          } else {
            const errorData = await waResponse.json();
            console.error(`❌ Error enviando WhatsApp a ${phone}:`, errorData);
          }
        } catch (waError) {
          console.error(
            `❌ Error crítico enviando WhatsApp a ${phone}:`,
            waError
          );
        }
      }

      console.log(`✅ Proceso de envío de WhatsApp completado`);
    }

    // Resumen final
    const summary = {
      total: usersData.length,
      guardados: resultados.filter((r) => r.estado === 'GUARDADO').length,
      yaExiste: resultados.filter((r) => r.estado === 'YA_EXISTE').length,
      errores: resultados.filter((r) => r.estado === 'ERROR').length,
      emailErrors: emailErrors.length,
    };

    console.log('📊 Resumen:', summary);

    // Preparar payload y archivos
    const payload = {
      generatedAt: new Date().toISOString(),
      summary,
      resultados,
    };

    const jsonBuffer = Buffer.from(JSON.stringify(payload, null, 2));
    const excelBuffer = buildExcelFromResultados(resultados, summary);

    // FASE 3: Enviar reportes por email
    console.log('\n📨 Fase 3: Enviando reportes...');
    await Promise.allSettled([
      transporter.sendMail({
        from: '"Artiefy" <direcciongeneral@artiefy.com>',
        to: 'lmsg829@gmail.com',
        subject: 'Reporte de carga masiva de usuarios - Artiefy',
        html: `
          <h2>Reporte de Carga Masiva de Usuarios</h2>
          <p>Se ha completado el proceso de carga masiva. Aquí están los resultados:</p>
          <ul>
            <li><strong>Total procesados:</strong> ${summary.total}</li>
            <li><strong>Guardados (nuevos):</strong> ${summary.guardados}</li>
            <li><strong>Ya existían:</strong> ${summary.yaExiste}</li>
            <li><strong>Errores:</strong> ${summary.errores}</li>
            <li><strong>Errores de email:</strong> ${summary.emailErrors}</li>
          </ul>
          <p>Se adjuntan los archivos <code>resultado.json</code> y <code>resultado.xlsx</code> con los detalles completos.</p>
          <hr>
          <p style="font-size:12px;color:#666;">Generado: ${new Date().toLocaleString('es-ES')}</p>
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
        successfulUsers
          .filter((u) => u.isNew)
          .map((u) => ({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
          }))
      ),
    ]);

    console.log('✅ Proceso completo finalizado');

    return NextResponse.json({
      message: 'Proceso completado exitosamente',
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
    console.error('❌ Error fatal al procesar el archivo:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar el archivo',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export function GET() {
  try {
    const templateData = [
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        role: 'estudiante',
        phone: '3001234567',
        document: '1234567890',
      },
      {
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@example.com',
        role: 'educador',
        phone: '3009876543',
        document: '0987654321',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    const instructions = [
      {
        Campo: 'firstName',
        Descripción: 'Nombre del usuario (obligatorio)',
        Ejemplo: 'Juan',
      },
      {
        Campo: 'lastName',
        Descripción: 'Apellido del usuario (obligatorio)',
        Ejemplo: 'Pérez',
      },
      {
        Campo: 'email',
        Descripción: 'Email del usuario (obligatorio, único)',
        Ejemplo: 'juan.perez@example.com',
      },
      {
        Campo: 'role',
        Descripción: 'Rol: estudiante, educador, admin, super-admin',
        Ejemplo: 'estudiante',
      },
      {
        Campo: 'phone',
        Descripción: 'Teléfono del usuario (opcional)',
        Ejemplo: '3001234567',
      },
      {
        Campo: 'document',
        Descripción: 'Documento de identificación (opcional)',
        Ejemplo: '1234567890',
      },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    }) as ArrayBuffer;

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
