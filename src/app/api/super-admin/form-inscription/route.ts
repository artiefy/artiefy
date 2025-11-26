/* eslint-disable */
import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { db } from '~/server/db';
import { credentialsDeliveryLogs, emailLogs } from '~/server/db/schema';
import {
  comercials,
  dates,
  enrollmentPrograms,
  horario,
  pagos,
  programas,
  sede,
  userCredentials,
  userInscriptionDetails,
  users,
} from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

export const runtime = 'nodejs'; // asegurar Node runtime (Buffer/S3)

const BUCKET = process.env.AWS_S3_BUCKET ?? process.env.AWS_BUCKET_NAME ?? ''; // 👈 acepta ambas

if (!BUCKET) {
  throw new Error(
    'Falta AWS_S3_BUCKET o AWS_BUCKET_NAME en variables de entorno'
  );
}

// Base pública para construir URLs
const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_AWS_S3_URL ??
  `https://s3.us-east-2.amazonaws.com/${BUCKET}`;

/* =========================
   Email
   ========================= */
const ACADEMIC_MAIL = 'secretariaacademica@ciadet.co';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER ?? 'direcciongeneral@artiefy.com',
    pass: process.env.PASS,
  },
});

// Importa la nueva tabla

interface AcademicNotifyPayload {
  studentName: string;
  studentEmail: string;
  identificacionTipo: string;
  identificacionNumero: string;
  telefono: string;
  pais: string;
  ciudad: string;
  direccion: string;
  nivelEducacion: string;

  programa: string;
  fechaInicio: string;
  sede: string;
  horario: string;
  modalidad: string;
  numeroCuotas: string;
  pagoInscripcion: string;
  pagoCuota1: string;
  comercial?: string;

  // Links opcionales a S3 (si existen)
  idDocUrl?: string | null;
  utilityBillUrl?: string | null;
  diplomaUrl?: string | null;
  pagareUrl?: string | null;
  comprobanteInscripcionUrl?: string | null;
}

// Función auxiliar para guardar logs
async function logEmail(data: {
  userId?: string;
  email: string;
  emailType: 'welcome' | 'academic_notification' | 'other';
  subject: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  errorDetails?: unknown;
  recipientName?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(emailLogs).values({
      userId: data.userId ?? null,
      email: data.email,
      emailType: data.emailType,
      subject: data.subject,
      status: data.status,
      errorMessage: data.errorMessage ?? null,
      errorDetails: data.errorDetails
        ? JSON.parse(JSON.stringify(data.errorDetails))
        : null,
      recipientName: data.recipientName ?? null,
      metadata: data.metadata ?? null,
      createdAt: new Date(),
    });
    console.log(
      `[EMAIL LOG] ${data.status.toUpperCase()} - ${data.emailType} a ${data.email}`
    );
  } catch (logErr) {
    console.error('[EMAIL LOG] Error guardando log:', logErr);
  }
}

// Actualiza sendWelcomeEmail
async function sendWelcomeEmail(
  to: string,
  username: string,
  password: string,
  userId?: string
) {
  const safePassword = password
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const subject = 'Bienvenido a Artiefy - Tus Credenciales de Acceso';

  const mailOptions = {
    from: `"Artiefy" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    replyTo: 'direcciongeneral@artiefy.com',
    html: `
      <h2>¡Bienvenido a Artiefy, ${username}!</h2>
      <p>Estas son tus credenciales de acceso:</p>
      <ul>
        <li><strong>Usuario:</strong> ${username}</li>
        <li><strong>Email:</strong> ${to}</li>
        <li><strong>Contraseña:</strong> <code>${safePassword}</code></li>
      </ul>
      <p>Ingresa a <a href="https://artiefy.com/" target="_blank">Artiefy</a> y cambia tu contraseña lo antes posible.</p>
      <hr/>
      <p>Equipo de Artiefy 🎨</p>
    `,
    text: `
Bienvenido a Artiefy, ${username}!

Tus credenciales:
- Usuario: ${username}
- Email: ${to}
- Contraseña: ${password}

Ingresa a https://artiefy.com/ y cambia tu contraseña.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);

    // ✅ Log exitoso
    await logEmail({
      userId,
      email: to,
      emailType: 'welcome',
      subject,
      status: 'success',
      recipientName: username,
    });
  } catch (error) {
    // ❌ Log de error
    await logEmail({
      userId,
      email: to,
      emailType: 'welcome',
      subject,
      status: 'failed',
      errorMessage:
        error instanceof Error ? error.message : 'Error desconocido',
      errorDetails: error,
      recipientName: username,
    });

    throw error; // Re-lanza el error para que lo capture el try-catch del POST
  }
}

// Actualiza sendAcademicNotification
async function sendAcademicNotification(to: string, p: AcademicNotifyPayload) {
  const subject = `Nueva matrícula/compra – ${p.studentName} – ${p.programa}`;

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9fc;padding:0;margin:0;">
    <!-- ... tu HTML actual ... -->
  </table>
  `;

  const text = `
Artiefy · Secretaría Académica – Notificación de matrícula/compra
  <!-- ... tu texto actual ... -->
  `;

  try {
    await transporter.sendMail({
      from: `"Artiefy – Notificaciones" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
      replyTo: 'direcciongeneral@artiefy.com',
    });

    // ✅ Log exitoso
    await logEmail({
      email: to,
      emailType: 'academic_notification',
      subject,
      status: 'success',
      recipientName: 'Secretaría Académica',
      metadata: {
        studentName: p.studentName,
        studentEmail: p.studentEmail,
        programa: p.programa,
        comercial: p.comercial,
      },
    });
  } catch (error) {
    // ❌ Log de error
    await logEmail({
      email: to,
      emailType: 'academic_notification',
      subject,
      status: 'failed',
      errorMessage:
        error instanceof Error ? error.message : 'Error desconocido',
      errorDetails: error,
      recipientName: 'Secretaría Académica',
      metadata: {
        studentName: p.studentName,
        studentEmail: p.studentEmail,
        programa: p.programa,
      },
    });

    throw error;
  }
}

const fieldsSchema = z.object({
  primerNombre: z.string().min(1),
  segundoNombre: z.string().optional().default(''),
  primerApellido: z.string().min(1),
  segundoApellido: z.string().optional().default(''),

  identificacionTipo: z.string().min(1),
  identificacionNumero: z.string().min(1),
  email: z.string().email(),
  direccion: z.string().min(1),
  pais: z.string().min(1),
  ciudad: z.string().min(1),
  telefono: z.string().min(1),
  birthDate: z.string().optional().default(''),
  fecha: z.string().optional().default(''),
  nivelEducacion: z.string().min(1),
  tieneAcudiente: z.string().optional().default(''),
  acudienteNombre: z.string().optional().default(''),
  acudienteContacto: z.string().optional().default(''),
  acudienteEmail: z.string().optional().default(''),
  programa: z.string().min(1),
  fechaInicio: z.string().min(1),
  comercial: z.string().optional().default(''),
  sede: z.string().min(1),
  horario: z.string().min(1),
  pagoInscripcion: z.string().min(1),
  pagoCuota1: z.string().min(1),
  modalidad: z.string().min(1),
  numeroCuotas: z.string().min(1),
});

/* =========================
   POST: crea en Clerk, guarda en BD y matrícula al programa
   ========================= */
export async function POST(req: Request) {
  console.log('==== [FORM SUBMIT] INICIO ====');
  try {
    // 🔥 CAMBIO: Ahora recibimos JSON, no FormData
    const data = await req.json();

    const fields = fieldsSchema.parse(data);
    console.log('[FIELDS PARSED]:', JSON.stringify(fields));
    // Tipar el objeto data para TypeScript
    interface FormDataWithFiles {
      docIdentidadKey?: string;
      docIdentidadUrl?: string;
      reciboServicioKey?: string;
      reciboServicioUrl?: string;
      actaGradoKey?: string;
      actaGradoUrl?: string;
      pagareKey?: string;
      pagareUrl?: string;
      comprobanteInscripcionKey?: string;
      comprobanteInscripcionUrl?: string;
      comprobanteInscripcionName?: string;
    }

    const fileData = data as FormDataWithFiles;

    // 🔥 CAMBIO: Los archivos YA están en S3, solo recibimos las URLs/keys
    // 🔥 CAMBIO: Los archivos YA están en S3, solo recibimos las URLs/keys
    const idDocKey = fileData.docIdentidadKey ?? null;
    const idDocUrl = fileData.docIdentidadUrl ?? null;

    const utilityBillKey = fileData.reciboServicioKey ?? null;
    const utilityBillUrl = fileData.reciboServicioUrl ?? null;

    const diplomaKey = fileData.actaGradoKey ?? null;
    const diplomaUrl = fileData.actaGradoUrl ?? null;

    const pagareKey = fileData.pagareKey ?? null;
    const pagareUrl = fileData.pagareUrl ?? null;

    const comprobanteInscripcionKey =
      fileData.comprobanteInscripcionKey ?? null;
    const comprobanteInscripcionUrl =
      fileData.comprobanteInscripcionUrl ?? null;
    // 1) Crear usuario en Clerk o recuperar existente por email
    const firstNameClerk = [fields.primerNombre, fields.segundoNombre]
      .filter(Boolean)
      .join(' ')
      .trim();

    const lastNameClerk = [fields.primerApellido, fields.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .trim();

    const fullName = [firstNameClerk, lastNameClerk]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const role = 'estudiante' as const;

    // Suscripción
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const formattedEndDate = subscriptionEndDate
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const client = await clerkClient();

    let userId: string;
    let generatedPassword: string | null = null;
    let usernameForEmail: string;
    let wasExistingClerkUser = false;

    // 0) PRE-CHECK: si ya existe en Clerk por email, lo usamos
    const list = await client.users.getUserList({
      emailAddress: [fields.email],
      limit: 1,
    });

    // Clerk a veces devuelve array directo o { data: [] }
    const existing = Array.isArray(list) ? list[0] : (list?.data?.[0] ?? null);

    if (existing) {
      console.log('[CLERK] Email ya existe. Se actualizará usuario existente.');
      wasExistingClerkUser = true;

      userId = existing.id;
      usernameForEmail = existing.username ?? fields.primerNombre;
      generatedPassword = null; // no hay password nuevo
    } else {
      // 1) Si NO existe, lo creamos
      console.time('[1] createUser (Clerk)');

      const created = await createUser(
        firstNameClerk,
        lastNameClerk,
        fields.email,
        role,
        'active',
        formattedEndDate
      );

      console.timeEnd('[1] createUser (Clerk)');

      if (!created) {
        console.error('[CLERK] No se pudo crear el usuario');
        return NextResponse.json(
          { error: 'No se pudo crear usuario en Clerk' },
          { status: 400 }
        );
      }

      userId = created.user.id;
      generatedPassword = created.generatedPassword ?? null;
      usernameForEmail = created.user.username ?? fields.primerNombre;
    }

    // Actualizar SIEMPRE datos en Clerk (nuevo o existente)
    await client.users.updateUser(userId, {
      firstName: firstNameClerk,
      lastName: lastNameClerk,
      publicMetadata: {
        planType: 'Premium',
        subscriptionStatus: 'active',
        subscriptionEndDate: formattedEndDate,
      },
    });

    // Calcular fecha fin (ahora + 1 mes)
    // Guarda el id Clerk antes de cualquier cambio
    const clerkUserId = userId;

    // 1) Buscar si ya existe en BD por email (sin ON CONFLICT)
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, fields.email))
      .limit(1);

    // Si no existe: INSERT normal con id Clerk
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: clerkUserId,
        role,
        name: fullName,
        email: fields.email,
        phone: fields.telefono,
        address: fields.direccion,
        country: fields.pais,
        city: fields.ciudad,
        birthDate: fields.birthDate?.trim()
          ? new Date(fields.birthDate).toISOString().split('T')[0]
          : null,
        subscriptionEndDate,
        planType: 'Premium',
        subscriptionStatus: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // dejamos userId igual al clerk id
      userId = clerkUserId;
    } else {
      // Si existe: UPDATE manual
      const dbUserId = existingUser[0].id;

      // Si el id en BD es diferente al de Clerk:
      // NO lo cambies (evitas romper PK/FKs), y usa el de BD para relaciones internas
      if (dbUserId !== clerkUserId) {
        console.warn(
          `[USERS] Email existe en BD con otro id. DB=${dbUserId} Clerk=${clerkUserId}. Manteniendo DB id para relaciones.`
        );
        userId = dbUserId;
      }

      await db
        .update(users)
        .set({
          role,
          name: fullName,
          email: fields.email,
          phone: fields.telefono,
          address: fields.direccion,
          country: fields.pais,
          city: fields.ciudad,
          birthDate: fields.birthDate?.trim()
            ? new Date(fields.birthDate).toISOString().split('T')[0]
            : null,
          subscriptionEndDate,
          planType: 'Premium',
          subscriptionStatus: 'activo',
          updatedAt: new Date(),
        })
        .where(eq(users.id, dbUserId));
    }

    // 3) user_credentials: upsert manual (sin tocar schema)
    if (generatedPassword !== null) {
      console.log('[CRED] Upsert user_credentials para userId:', userId);
      const existingCred = await db
        .select({ id: userCredentials.id })
        .from(userCredentials)
        .where(eq(userCredentials.userId, userId))
        .limit(1);

      if (existingCred.length > 0) {
        console.log('[CRED] Existe. UPDATE…');
        await db
          .update(userCredentials)
          .set({
            password: generatedPassword,
            clerkUserId: userId,
            email: fields.email,
          })
          .where(eq(userCredentials.userId, userId));
      } else {
        console.log('[CRED] No existe. INSERT…');
        await db.insert(userCredentials).values({
          userId,
          password: generatedPassword,
          clerkUserId: userId,
          email: fields.email,
        });
      }
      console.log('[CRED] Listo.');
    } else {
      console.log('[CRED] No se generó password (posible reutilización).');
    }

    const existingDetails = await db
      .select({ userId: userInscriptionDetails.userId })
      .from(userInscriptionDetails)
      .where(eq(userInscriptionDetails.userId, userId))
      .limit(1);

    const detailsPayload = {
      userId,
      identificacionTipo: fields.identificacionTipo,
      identificacionNumero: fields.identificacionNumero,
      nivelEducacion: fields.nivelEducacion,
      tieneAcudiente: fields.tieneAcudiente,
      acudienteNombre: fields.acudienteNombre,
      acudienteContacto: fields.acudienteContacto,
      acudienteEmail: fields.acudienteEmail,
      programa: fields.programa,
      fechaInicio: fields.fechaInicio,
      comercial: fields.comercial,
      sede: fields.sede,
      horario: fields.horario,
      pagoInscripcion: fields.pagoInscripcion,
      pagoCuota1: fields.pagoCuota1,
      modalidad: fields.modalidad,
      numeroCuotas: fields.numeroCuotas,
      idDocKey,
      utilityBillKey,
      diplomaKey,
      pagareKey,
    };

    if (existingDetails.length > 0) {
      await db
        .update(userInscriptionDetails)
        .set(detailsPayload)
        .where(eq(userInscriptionDetails.userId, userId));
    } else {
      await db.insert(userInscriptionDetails).values(detailsPayload);
    }

    // 6) Matricular SOLO al programa
    const programRow = await db.query.programas.findFirst({
      where: eq(programas.title, fields.programa),
      columns: { id: true, title: true },
    });
    if (!programRow) {
      console.error('[PROGRAM] No encontrado:', fields.programa);
      return NextResponse.json(
        { error: `Programa no encontrado: ${fields.programa}` },
        { status: 404 }
      );
    }
    console.log('[PROGRAM] Encontrado:', programRow);

    const alreadyEnrolled = await db
      .select({ id: enrollmentPrograms.id })
      .from(enrollmentPrograms)
      .where(
        and(
          eq(enrollmentPrograms.userId, userId),
          eq(enrollmentPrograms.programaId, programRow.id)
        )
      )
      .limit(1);

    if (alreadyEnrolled.length === 0) {
      await db.insert(enrollmentPrograms).values({
        programaId: programRow.id,
        userId,
        enrolledAt: new Date(),
        completed: false,
      });
      console.log(
        '[PROGRAM] Matriculado userId:',
        userId,
        'programaId:',
        programRow.id
      );
    } else {
      console.log('[PROGRAM] Ya estaba matriculado, no se duplica.');
    }

    // 7) Email credenciales (solo si se creó usuario nuevo y hubo contraseña)
    let welcomeEmailOk = false;
    let credentialsNote = '';

    if (generatedPassword) {
      try {
        await sendWelcomeEmail(
          fields.email,
          usernameForEmail,
          generatedPassword,
          userId
        );
        welcomeEmailOk = true;
        console.log('[EMAIL] ✓ Enviado a', fields.email);
      } catch (mailErr) {
        welcomeEmailOk = false;
        console.error(
          '❌ [EMAIL] Error enviando correo de bienvenida:',
          mailErr
        );
      }
    }

    // ✅ calcular nota según tus reglas
    if (!generatedPassword) {
      credentialsNote = 'no se generó contraseña';
    } else if (welcomeEmailOk) {
      credentialsNote = 'exitoso';
    } else {
      credentialsNote = 'no se envió correo';
    }

    // ✅ guardar log SIEMPRE
    try {
      await db.insert(credentialsDeliveryLogs).values({
        userId,
        usuario: usernameForEmail,
        contrasena: generatedPassword ?? null,
        correo: fields.email,
        nota: credentialsNote,
      });
      console.log('[CRED LOG] Insertado:', credentialsNote);
    } catch (logErr) {
      console.error('❌ [CRED LOG] No se pudo guardar log:', logErr);
    }

    // 8) Notificar a Secretaría Académica
    try {
      await sendAcademicNotification(ACADEMIC_MAIL, {
        studentName: fullName,
        studentEmail: fields.email,
        identificacionTipo: fields.identificacionTipo,
        identificacionNumero: fields.identificacionNumero,
        telefono: fields.telefono,
        pais: fields.pais,
        ciudad: fields.ciudad,
        direccion: fields.direccion,
        nivelEducacion: fields.nivelEducacion,
        programa: programRow.title,
        fechaInicio: fields.fechaInicio,
        sede: fields.sede,
        horario: fields.horario,
        modalidad: fields.modalidad,
        numeroCuotas: fields.numeroCuotas,
        pagoInscripcion: fields.pagoInscripcion,
        pagoCuota1: fields.pagoCuota1,
        comercial: fields.comercial,
        idDocUrl,
        utilityBillUrl,
        diplomaUrl,
        pagareUrl,
        comprobanteInscripcionUrl,
      });
      console.log('[EMAIL] ✓ Notificación enviada a Secretaría Académica');
    } catch (notifyErr) {
      console.error(
        '❌ [EMAIL] Error enviando notificación académica:',
        notifyErr
      );
      // Ya está logueado en sendAcademicNotification
    }
    // ... después de enviar notificaciones y todo
    // Solo registrar el pago si el usuario indicó que ya pagó la inscripción
    console.log(
      '[PAGO] valor de fields.pagoInscripcion =>',
      fields.pagoInscripcion
    );
    const pagoInscripcionEsSi = /^s[ií]$/i.test(fields.pagoInscripcion || '');

    if (pagoInscripcionEsSi) {
      try {
        const hoy = new Date();
        const fechaStr = hoy.toISOString().split('T')[0]; // "YYYY-MM-DD"

        const payload = {
          userId,
          programaId: programRow.id,
          concepto: 'Cuota 1', // o 'Inscripción' si prefieres
          nroPago: 1,
          fecha: fechaStr,
          metodo: 'Artiefy',
          valor: 150000,
          createdAt: hoy,

          // Comprobante subido a S3
          receiptKey: comprobanteInscripcionKey ?? null,
          receiptUrl: comprobanteInscripcionUrl ?? null,
          receiptName: fileData.comprobanteInscripcionName ?? null,
          receiptUploadedAt: hoy,
        };

        console.log('[PAGO] Insert payload =>', payload);

        const inserted = await db.insert(pagos).values(payload).returning({
          id: pagos.id,
          userId: pagos.userId,
          programaId: pagos.programaId,
          concepto: pagos.concepto,
          nroPago: pagos.nroPago,
          fecha: pagos.fecha,
          metodo: pagos.metodo,
          valor: pagos.valor,
          receiptKey: pagos.receiptKey,
          receiptUrl: pagos.receiptUrl,
          createdAt: pagos.createdAt,
        });

        console.log('[PAGO] Resultado de INSERT (returning):');
        console.table(inserted);

        if (inserted?.length) {
          console.log(
            `[PAGO OK] id=${inserted[0].id} registrado para userId=${userId}, programaId=${programRow.id}`
          );
        } else {
          console.warn('[PAGO] INSERT no devolvió filas (returning vacío).');
        }
      } catch (pagoErr) {
        console.error('❌ Error creando pago automático:', pagoErr);
      }
    } else {
      console.log(
        '[PAGO] No se registra pago porque pagoInscripcion ≠ "Sí". Valor:',
        fields.pagoInscripcion
      );
    }

    console.log('==== [FORM SUBMIT] FIN OK ====');

    console.log('==== [FORM SUBMIT] FIN OK ====');
    return NextResponse.json({
      ok: true,
      userId,
      existedInClerk: wasExistingClerkUser,
      message: wasExistingClerkUser
        ? 'El usuario ya existía en Clerk. Se actualizaron los datos en BD.'
        : 'Usuario creado y matriculado correctamente.',
      program: { id: programRow.id, title: programRow.title },
      emailSent: Boolean(generatedPassword),
      s3: {
        idDocKey,
        utilityBillKey,
        diplomaKey,
        pagareKey,
        idDocUrl,
        utilityBillUrl,
        diplomaUrl,
        pagareUrl,
        comprobanteInscripcionKey,
        comprobanteInscripcionUrl,
      },
      exampleVideoUrl: `${PUBLIC_BASE_URL}/documents/${uuidv4()}`,
    });
  } catch (err) {
    console.error('==== [FORM SUBMIT] FIN ERROR ====');
    console.error('❌ Error en submit inscripción:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/* =========================
   GET: para poblar selects
   ========================= */
/* =========================
   GET: para poblar selects
   ========================= */
export async function GET() {
  try {
    const allDates = await db.select().from(dates);
    const allComercials = await db.select().from(comercials);
    const allHorarios = await db.select().from(horario);
    const allSedes = await db.select().from(sede); // 👈 igual formato que los demás

    return NextResponse.json({
      dates: allDates,
      comercials: allComercials,
      horarios: allHorarios,
      sedes: allSedes, // 👈 ahora tu front puede mapear s.nombre
    });
  } catch (e) {
    console.error('GET /form-inscription error:', e);
    return NextResponse.json(
      { error: 'No se pudieron cargar las configuraciones del formulario' },
      { status: 500 }
    );
  }
}
