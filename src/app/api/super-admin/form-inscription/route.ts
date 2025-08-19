import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
  programas,
  userCredentials,
  userInscriptionDetails,
  users,
} from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

export const runtime = 'nodejs'; // asegurar Node runtime (Buffer/S3)

const REGION = process.env.AWS_REGION ?? 'us-east-2';
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
    subject: '🎨 Bienvenido a Artiefy - Tus Credenciales de Acceso',
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

// ---------- S3 ----------
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadToS3(file: File | null, prefix: string) {
  if (!file) return { key: null as string | null, url: null as string | null };

  const arrayBuf = await file.arrayBuffer();
  const Body = Buffer.from(arrayBuf);

  const ext = file.type?.includes('pdf')
    ? '.pdf'
    : file.type?.includes('png')
      ? '.png'
      : file.type?.includes('jpeg')
        ? '.jpg'
        : '';

  // 👇 guardamos TODO bajo "documents/"
  const key = `documents/${prefix}/${uuidv4()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET, // <- usa constante unificada
      Key: key,
      Body,
      ContentType: file.type || 'application/octet-stream',
      // ACL: 'public-read', // opcional: solo si tu bucket NO tiene política pública ya
    })
  );

  const url = `${PUBLIC_BASE_URL}/${key}`;
  return { key, url };
}

/* =========================
   Validación (Zod)
   ========================= */
const fieldsSchema = z.object({
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  identificacionTipo: z.string().min(1),
  identificacionNumero: z.string().min(1),
  email: z.string().email(),
  direccion: z.string().min(1),
  pais: z.string().min(1),
  ciudad: z.string().min(1),
  telefono: z.string().min(1),
  birthDate: z.string().optional().default(''), // YYYY-MM-DD o ''
  fecha: z.string().optional().default(''),
  nivelEducacion: z.string().min(1),
  tieneAcudiente: z.string().optional().default(''),
  acudienteNombre: z.string().optional().default(''),
  acudienteContacto: z.string().optional().default(''),
  acudienteEmail: z.string().optional().default(''),
  programa: z.string().min(1),
  fechaInicio: z.string().min(1), // yyyy-mm-dd (string)
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
    console.log('==== [FORM SUBMIT] INICIO ====');
    // multipart/form-data
    const form = await req.formData();

    // Campos de texto
    const text: Record<string, string> = {};
    form.forEach((v, k) => {
      if (typeof v === 'string') text[k] = v;
    });

    const fields = fieldsSchema.parse(text);
    console.log('[FIELDS PARSED]:', JSON.stringify(fields));

    // Archivos
    const docIdentidad = form.get('docIdentidad') as File | null;
    const reciboServicio = form.get('reciboServicio') as File | null;
    const actaGrado = form.get('actaGrado') as File | null;
    const pagare = form.get('pagare') as File | null;

    const fullName = `${fields.nombres} ${fields.apellidos}`.trim();
    const role = 'estudiante' as const;

    // 1) Crear SIEMPRE usuario en Clerk (para garantizar que usamos su id)
    console.time('[1] createUser (Clerk)');
    const created = await createUser(
      fields.nombres,
      fields.apellidos,
      fields.email,
      role
    );
    console.timeEnd('[1] createUser (Clerk)');
    if (!created) {
      console.error('[CLERK] No se pudo crear el usuario');
      return NextResponse.json(
        { error: 'No se pudo crear el usuario en Clerk' },
        { status: 400 }
      );
    }
    // Calcular fecha fin (ahora + 1 mes)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    // Formato "YYYY-MM-DD HH:mm:ss"
    const formattedEndDate = subscriptionEndDate
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const client = await clerkClient();
    await client.users.updateUser(created.user.id, {
      publicMetadata: {
        planType: 'Premium',
        subscriptionStatus: 'active',
        subscriptionEndDate: formattedEndDate,
      },
    });
    const userId = created.user.id; // <- id de Clerk (OBLIGATORIO en tus tablas)
    const generatedPassword = created.generatedPassword ?? null;
    const usernameForEmail = created.user.username ?? fields.nombres;
    console.log('[CLERK] Usuario creado:', {
      clerkId: userId,
      email: fields.email,
    });

    // 2) USERS: ensure row (insert si no existe) y luego update por id
    console.log(
      '[USERS UPSERT] userId:',
      userId,
      'birthDate:',
      fields.birthDate || null
    );
    await db
      .insert(users)
      .values({
        id: userId,
        role,
        name: fullName,
        email: fields.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing(); // evita violar PK si se reintenta

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
        birthDate:
          fields.birthDate && fields.birthDate.trim() !== ''
            ? fields.birthDate
            : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

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

    // 3) Subir archivos a S3 (quedarán en documents/<tipo>/...)
    const { key: idDocKey, url: idDocUrl } = await uploadToS3(
      docIdentidad,
      'identidad'
    );
    const { key: utilityBillKey, url: utilityBillUrl } = await uploadToS3(
      reciboServicio,
      'servicio'
    );
    const { key: diplomaKey, url: diplomaUrl } = await uploadToS3(
      actaGrado,
      'diploma'
    );
    const { key: pagareKey, url: pagareUrl } = await uploadToS3(
      pagare,
      'pagare'
    );

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
export async function GET() {
  const allDates = await db.select().from(dates);
  const allComercials = await db.select().from(comercials);
  const allHorarios = await db.select().from(horario);

  return NextResponse.json({
    dates: allDates,
    comercials: allComercials,
    horarios: allHorarios,
  });
}
