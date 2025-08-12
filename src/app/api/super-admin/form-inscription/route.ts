// src/app/api/super-admin/form-inscription/submit/route.ts
import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { z } from 'zod';

import { db } from '~/server/db';
import {
  comercials,
  dates,
  enrollmentPrograms,
  programas,
  userCredentials,
  userCustomFields,
  users,
} from '~/server/db/schema';
// 👉 Debe devolver: { user: { id, username? }, generatedPassword?: string }
import { createUser } from '~/server/queries/queries';

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

const bodySchema = z.object({
  fields: fieldsSchema,
});

type Fields = z.infer<typeof fieldsSchema>;

/* =========================
   POST: crea en Clerk, guarda en BD y matrícula al programa
   ========================= */
export async function POST(req: Request) {
  console.log('==== [FORM SUBMIT] INICIO ====');
  try {
    const raw = await req.json();
    console.log('[REQ BODY RAW]:', JSON.stringify(raw));

    const { fields } = bodySchema.parse(raw);
    console.log('[FIELDS PARSED]:', JSON.stringify(fields));

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

    // 4) Custom fields: upsert por (user_id, field_key)
    const entries = Object.entries(fields) as [keyof Fields, string][];
    if (entries.length > 0) {
      console.log('[CUSTOM FIELDS] Upserting', entries.length, 'campos');
      await db
        .insert(userCustomFields)
        .values(
          entries.map(([key, value]) => ({
            userId,
            fieldKey: String(key),
            fieldValue: String(value ?? ''),
          }))
        )
        .onConflictDoUpdate({
          target: [userCustomFields.userId, userCustomFields.fieldKey],
          set: {
            fieldValue: sql`excluded.field_value`,
            updatedAt: new Date(),
          },
        });
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
  const all = await db.select().from(userCustomFields);
  const allDates = await db.select().from(dates);
  const allComercials = await db.select().from(comercials);
  return NextResponse.json({
    fields: all,
    dates: allDates,
    comercials: allComercials,
  });
}
