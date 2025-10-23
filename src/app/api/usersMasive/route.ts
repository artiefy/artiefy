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
void userCredentials;
// Utilidades de validación
const safeTrim = (v?: string | null) => (typeof v === 'string' ? v.trim() : '');
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
  [key: string]: string | undefined; // Index signature para permitir campos dinámicos
}

interface ColumnMapping {
  excelColumn: string;
  dbField: string;
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

// Tipos para la respuesta de Clerk
interface ClerkUser {
  id: string;
}

interface ClerkUsersResponse {
  data?: ClerkUser[];
}

// Tipo para la respuesta de createUser
interface CreateUserResponse {
  user: ClerkUser;
  generatedPassword: string;
}

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'direcciongeneral@artiefy.com',
    pass: process.env.PASS,
  },
});

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

// Enviar correo de bienvenida con reintentos
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

// Notificar a Secretaría Académica
async function sendAcademicNotification(
  to: string,
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
    console.log('✅ Notificación académica enviada');
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

    const json = await res.json() as ClerkUser[] | ClerkUsersResponse;

    // Manejar ambos formatos de respuesta de Clerk
    const arr: ClerkUser[] = Array.isArray(json)
      ? json
      : Array.isArray((json as ClerkUsersResponse).data)
        ? (json as ClerkUsersResponse).data ?? []
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

// Delay entre requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        sampleData: rawData.slice(0, 5)
      });
    }

    const mappings: ColumnMapping[] = JSON.parse(mappingsJson as string);

    // Mapear datos según las columnas seleccionadas
    const usersData = rawData.map((row) => {
      const mappedRow: Record<string, unknown> = {};
      mappings.forEach(({ excelColumn, dbField }) => {
        const value = (row as Record<string, unknown>)[excelColumn];
        // Convertir valores a string y limpiar
        let stringValue = '';
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            stringValue = JSON.stringify(value);
          } else if (typeof value === 'string') {
            stringValue = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            stringValue = String(value);
          } else {
            // Para cualquier otro tipo, intentar convertirlo a string de forma segura
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

    console.log(`📊 Procesando ${usersData.length} usuarios...`);

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];

      // Sanitización
      const firstName = safeTrim(userData.firstName);
      const lastName = safeTrim(userData.lastName);
      const email = safeTrim(userData.email).toLowerCase();
      const role = safeTrim(userData.role) || 'estudiante';
      const phone = safeTrim(userData.phone);
      const documentNumber = safeTrim(userData.document ?? userData.identificacionNumero);

      // Log ÚNICO para debug (eliminamos duplicación)
      console.log(`[${i + 1}/${usersData.length}] 📝 Sanitizado ${email}:`, {
        firstName,
        lastName,
        phone: phone || 'SIN TELÉFONO',
        document: documentNumber || 'SIN DOCUMENTO',
        role
      });

      // Log para debug
      console.log(`📝 Datos sanitizados para ${email}:`, {
        firstName,
        lastName,
        phone,
        documentNumber,
        role
      });
      // Validación de campos obligatorios
      if (!firstName || !lastName || !email) {
        resultados.push({
          email: email || `fila_${i + 1}`,
          estado: 'ERROR',
          detalle: 'Campos obligatorios faltantes (firstName, lastName o email)',
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

      // Validación de rol
      const validRoles = ['estudiante', 'educador', 'admin', 'super-admin'];
      if (!validRoles.includes(role)) {
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: `Rol inválido: ${role}. Roles válidos: ${validRoles.join(', ')}`,
        });
        continue;
      }

      let step = 'init';

      try {
        console.log(`[${i + 1}/${usersData.length}] Procesando: ${email}`);

        // Delay cada 10 usuarios para evitar rate limits
        if (i > 0 && i % 10 === 0) {
          console.log('⏳ Pausa de 2s para evitar rate limits...');
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
          // Intentar crear usuario en Clerk
          const result = await createUser(firstName, lastName, email, role);

          if (isCreateUserResponse(result)) {
            // Usuario creado exitosamente
            isNewInClerk = true;
            clerkUser = result.user;
            generatedPassword = result.generatedPassword ?? null;
          } else {
            // Ya existía en Clerk, buscar por email
            clerkUser = await getClerkUserByEmail(email);
          }

        } catch (clerkError: unknown) {
          const errorMsg = getClerkErrorMessage(clerkError);
          console.log(`⚠️ Error Clerk para ${email}: ${errorMsg}`);
          const clerkErrObj = clerkError as ClerkError;

          // Verificar si es un error de "ya existe"
          const probablyExists =
            [409, 422].includes(clerkErrObj?.status ?? 0) ||
            /already\s*exist/i.test(errorMsg) ||
            /identifier.*in\s*use/i.test(errorMsg) ||
            /email.*taken/i.test(errorMsg);

          if (probablyExists) {
            step = 'syncExistingUser';
            // Buscar usuario existente en Clerk
            clerkUser = await getClerkUserByEmail(email);

            if (!clerkUser) {
              resultados.push({
                email,
                estado: 'ERROR',
                detalle: 'El usuario existe en Clerk pero no se pudo obtener su información',
              });
              continue;
            }
          } else {
            // Error real de Clerk
            if (clerkErrObj?.status === 403) {
              resultados.push({
                email,
                estado: 'ERROR',
                detalle: `Clerk: Acceso denegado (403). Verifica permisos de API`,
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

        // Verificar que tenemos un usuario de Clerk
        if (!clerkUser) {
          resultados.push({
            email,
            estado: 'ERROR',
            detalle: 'No se pudo obtener o crear usuario en Clerk',
          });
          continue;
        }
        // Guardar/actualizar en base de datos (sin transacciones)
        step = 'dbUpsertUser';

        // Verificar si el usuario ya existe en la BD
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          // Usuario existe, actualizar sin tocar el id
          await db
            .update(users)
            .set({
              name: `${firstName} ${lastName}`,
              role: role as 'estudiante' | 'educador' | 'admin' | 'super-admin',
              updatedAt: new Date(),
              planType: 'Premium',
              subscriptionEndDate: new Date(formattedEndDate),
              phone: phone || null,
              identificacionNumero: documentNumber || null,
              document: documentNumber || null,
            })
            .where(eq(users.id, existingUser[0].id));

          console.log(`✅ Usuario actualizado: ${email} | Teléfono: ${phone || 'N/A'} | Documento: ${documentNumber || 'N/A'}`);
        } else {
          // Usuario nuevo, insertar
          await db
            .insert(users)
            .values({
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

          console.log(`✅ Usuario insertado en BD: ${email} - phone: ${phone}, doc: ${documentNumber}`);
        }
        // Registrar resultado
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

        // Enviar email de bienvenida solo a usuarios nuevos
        if (isNewInClerk && generatedPassword) {
          credenciales.push({ correo: email, contraseña: generatedPassword });

          step = 'sendWelcomeEmail';
          const fullName = `${firstName} ${lastName}`.trim();
          let emailSent = false;

          // Intentar enviar hasta 3 veces
          for (let attempts = 0; attempts < 3 && !emailSent; attempts++) {
            if (attempts > 0) {
              console.log(`⏳ Reintento ${attempts} de email para ${email}`);
              await delay(1000);
            }
            emailSent = await sendWelcomeEmail(email, fullName, generatedPassword);
          }

          if (!emailSent) {
            emailErrors.push(email);
            console.error(`❌ No se pudo enviar email de bienvenida a ${email}`);
          }
        }

      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Error [${step}] para ${email}:`, msg);
        resultados.push({
          email,
          estado: 'ERROR',
          detalle: `${step}: ${msg}`,
        });
      }
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

    // Enviar reportes por email (tolerante a fallos)
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
        'lmsg829@gmail.com',
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
        details: error instanceof Error ? error.message : 'Error desconocido'
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

    // Agregar instrucciones en una segunda hoja
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