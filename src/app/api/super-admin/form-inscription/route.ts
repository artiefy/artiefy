import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { db } from '~/server/db';
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
  users
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

async function sendWelcomeEmail(
  to: string,
  username: string,
  password: string
) {
  const safePassword = password
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const mailOptions = {
    from: `"Artiefy" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Bienvenido a Artiefy - Tus Credenciales de Acceso',
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

  await transporter.sendMail(mailOptions);
}

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

function row(label: string, value?: string | null) {
  const v = (value ?? '').trim();
  return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#555;"><strong>${label}</strong></td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#111;">${v || '-'}</td>
    </tr>
  `;
}

function linkRow(label: string, url?: string | null) {
  const has = !!url;
  return row(
    label,
    has
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Ver documento</a>`
      : ''
  );
}

async function sendAcademicNotification(to: string, p: AcademicNotifyPayload) {
  const subject = `Nueva matrícula/compra – ${p.studentName} – ${p.programa}`;

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9fc;padding:0;margin:0;">
    <tr><td>
      <div style="max-width:680px;margin:32px auto;background:#ffffff;border:1px solid #eaeaea;border-radius:10px;overflow:hidden;">
        <div style="background:#0B132B;color:#fff;padding:20px 24px;">
          <h1 style="margin:0;font-size:20px;line-height:1.2;">Artiefy · Secretaría Académica</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#cfe8ff;">Notificación de matrícula / compra</p>
        </div>
        <div style="padding:20px 24px;">
          <p style="margin:0 0 12px;color:#111;">Hola equipo de Secretaría Académica,</p>
          <p style="margin:0 0 18px;color:#333;">Se ha registrado una nueva matrícula/compra. A continuación el resumen:</p>

          <h3 style="margin:0 0 8px;color:#0B132B;">Datos del estudiante</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
            ${row('Nombre completo', p.studentName)}
            ${row('Email', p.studentEmail)}
            ${row('Identificación', `${p.identificacionTipo} · ${p.identificacionNumero}`)}
            ${row('Teléfono', p.telefono)}
            ${row('Dirección', `${p.direccion}`)}
            ${row('Ciudad / País', `${p.ciudad} / ${p.pais}`)}
            ${row('Nivel de educación', p.nivelEducacion)}
          </table>

          <h3 style="margin:0 0 8px;color:#0B132B;">Detalle de matrícula / compra</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
            ${row('Programa / Curso', p.programa)}
            ${row('Fecha de inicio', p.fechaInicio)}
            ${row('Sede', p.sede)}
            ${row('Horario', p.horario)}
            ${row('Modalidad', p.modalidad)}
            ${row('Número de cuotas', p.numeroCuotas)}
            ${row('Pago inscripción', p.pagoInscripcion)}
            ${row('Asesor comercial', p.comercial ?? '')}
          </table>

          <h3 style="margin:0 0 8px;color:#0B132B;">Documentos adjuntos (enlaces)</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
            ${linkRow('Documento de identidad', p.idDocUrl)}
            ${linkRow('Recibo de servicio', p.utilityBillUrl)}
            ${linkRow('Acta / Diploma', p.diplomaUrl)}
            ${linkRow('Pagaré', p.pagareUrl)}
            ${linkRow('Comprobante de inscripción', p.comprobanteInscripcionUrl)}
          </table>

          <p style="margin:12px 0 0;color:#666;font-size:12px;">
            *Este correo es informativo y fue generado automáticamente por Artiefy.
          </p>
        </div>
      </div>
    </td></tr>
  </table>
  `;

  const text = `
Artiefy · Secretaría Académica – Notificación de matrícula/compra

[Datos del estudiante]
- Nombre completo: ${p.studentName}
- Email: ${p.studentEmail}
- Identificación: ${p.identificacionTipo} · ${p.identificacionNumero}
- Teléfono: ${p.telefono}
- Dirección: ${p.direccion}
- Ciudad / País: ${p.ciudad} / ${p.pais}
- Nivel de educación: ${p.nivelEducacion}

[Detalle de matrícula / compra]
- Programa / Curso: ${p.programa}
- Fecha de inicio: ${p.fechaInicio}
- Sede: ${p.sede}
- Horario: ${p.horario}
- Modalidad: ${p.modalidad}
- Número de cuotas: ${p.numeroCuotas}
- Pago inscripción: ${p.pagoInscripcion}
- Pago primera cuota: ${p.pagoCuota1}
- Asesor comercial: ${p.comercial ?? ''}

[Documentos]
- Documento de identidad: ${p.idDocUrl ?? '-'}
- Recibo de servicio: ${p.utilityBillUrl ?? '-'}
- Acta / Diploma: ${p.diplomaUrl ?? '-'}
- Pagaré: ${p.pagareUrl ?? '-'}
- Comprobante de inscripción: ${p.comprobanteInscripcionUrl ?? '-'}

Este correo fue generado automáticamente por Artiefy.
  `;

  await transporter.sendMail({
    from: `"Artiefy – Notificaciones" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
    replyTo: 'direcciongeneral@artiefy.com',
  });
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

    const comprobanteInscripcionKey = fileData.comprobanteInscripcionKey ?? null;
    const comprobanteInscripcionUrl = fileData.comprobanteInscripcionUrl ?? null;
    // 1) Crear SIEMPRE usuario en Clerk (para garantizar que usamos su id)
    console.time('[1] createUser (Clerk)');
    // === Nombres normalizados para Clerk y BD ===
    const firstNameClerk = [fields.primerNombre, fields.segundoNombre]
      .filter(Boolean)
      .join(' ')
      .trim();

    const lastNameClerk = [fields.primerApellido, fields.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .trim();

    // Nombre completo para BD (columna `name`)
    const fullName = [firstNameClerk, lastNameClerk]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Rol en el scope
    const role = 'estudiante' as const;

    // === Suscripción (la necesitas para formattedEndDate ANTES de createUser) ===
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    // Formato "YYYY-MM-DD HH:mm:ss" (si tu createUser lo usa como string)
    const formattedEndDate = subscriptionEndDate
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');


    // Asegura rol en el scope

    // 1) Crear SIEMPRE usuario en Clerk (para garantizar que usamos su id)
    console.time('[1] createUser (Clerk)');

    const created = await createUser(
      firstNameClerk,         // concatenado
      lastNameClerk,          // concatenado
      fields.email,
      role,                   // 'estudiante'
      'active',               // opcional
      formattedEndDate        // opcional: tu firma admite endDate string
    );

    console.timeEnd('[1] createUser (Clerk)');

    if (!created) {
      console.error('[CLERK] No se pudo crear el usuario');
      return NextResponse.json(
        { error: 'No se pudo crear el usuario en Clerk' },
        { status: 400 }
      );
    }

    const userId = created.user.id;
    const generatedPassword = created.generatedPassword ?? null;
    const usernameForEmail = created.user.username ?? fields.primerNombre;



    const client = await clerkClient();
    await client.users.updateUser(created.user.id, {
      firstName: firstNameClerk,   // p.ej. "Luis Miguel"
      lastName: lastNameClerk,    // p.ej. "García Márquez"
      publicMetadata: {
        planType: 'Premium',
        subscriptionStatus: 'active',
        subscriptionEndDate: formattedEndDate
      },
    });

    // Calcular fecha fin (ahora + 1 mes)

    await db.insert(users).values({
      id: userId,
      role,
      name: fullName,                 // 👈 concatenado
      email: fields.email,
      subscriptionEndDate,            // Date está bien para timestamp (mode: 'date')
      planType: 'Premium',
      subscriptionStatus: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();


    await db.update(users).set({
      role,
      name: fullName, // 👈 concatenado
      email: fields.email,
      phone: fields.telefono,
      address: fields.direccion,
      country: fields.pais,
      city: fields.ciudad,
      birthDate: fields.birthDate?.trim()
        ? new Date(fields.birthDate).toISOString().split('T')[0]
        : null, // tu columna es date()
      subscriptionEndDate,
      planType: 'Premium',
      subscriptionStatus: 'activo',
      updatedAt: new Date(),
    }).where(eq(users.id, userId));




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

    // 4) Guardar los campos EXTRA en userInscriptionDetails (no duplicar lo que ya está en `users`)
    await db.insert(userInscriptionDetails).values({
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
    });

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

    // 7) Email credenciales (solo si se creó usuario nuevo y hubo contraseña)
    if (generatedPassword) {
      try {
        await sendWelcomeEmail(
          fields.email,
          usernameForEmail,
          generatedPassword
        );
        console.log('[EMAIL] Enviado a', fields.email);
      } catch (mailErr) {
        console.error(
          '❌ [EMAIL] Error enviando correo de bienvenida:',
          mailErr
        );
      }
    } else {
      console.log('[EMAIL] No se envía (no hay contraseña generada).');
    }

    // 7) Notificar a Secretaría Académica
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
      console.log('[EMAIL] Notificación enviada a Secretaría Académica');
    } catch (notifyErr) {
      console.error(
        '❌ [EMAIL] Error enviando notificación académica:',
        notifyErr
      );
    }

    // ... después de enviar notificaciones y todo
    // Solo registrar el pago si el usuario indicó que ya pagó la inscripción
    console.log('[PAGO] valor de fields.pagoInscripcion =>', fields.pagoInscripcion);
    const pagoInscripcionEsSi = /^s[ií]$/i.test(fields.pagoInscripcion || '');

    if (pagoInscripcionEsSi) {
      try {
        const hoy = new Date();
        const fechaStr = hoy.toISOString().split('T')[0]; // "YYYY-MM-DD"

        const payload = {
          userId,
          programaId: programRow.id,
          concepto: 'Cuota 1',        // o 'Inscripción' si prefieres
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

        const inserted = await db
          .insert(pagos)
          .values(payload)
          .returning({
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
      // ejemplo que pediste (puedes construir “videoUrl” con cualquier key)
      exampleVideoUrl: `${PUBLIC_BASE_URL}/documents/${uuidv4()}`, // ilustrativo
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
