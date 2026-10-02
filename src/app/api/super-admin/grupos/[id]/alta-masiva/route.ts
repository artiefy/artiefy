/**
 * POST /api/super-admin/grupos/[id]/alta-masiva
 *
 * Alta masiva de estudiantes en una hoja (grupo). Para cada fila:
 *  - si el correo ya existe → solo se agrega a la hoja y se matricula al curso;
 *  - si es nuevo → crea la cuenta (Clerk + BD), envía y guarda credenciales,
 *    lo matricula al programa de la hoja y a su curso, y lo agrega a la hoja.
 *
 * Body: { rows: Fila[], programa?: string }
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { db } from '~/server/db';
import {
  credentialsDeliveryLogs,
  enrollments,
  grupoCursos,
  grupoEstudiantes,
  grupos,
  users,
} from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

const MAIL_FROM = 'direcciongeneral@artiefy.com';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: MAIL_FROM, pass: process.env.PASS },
});

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

async function enviarCredenciales(
  to: string,
  username: string,
  password: string
) {
  const safe = password
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  await transporter.sendMail({
    from: `"Artiefy" <${MAIL_FROM}>`,
    to,
    replyTo: MAIL_FROM,
    subject: 'Bienvenido a Artiefy - Tus Credenciales de Acceso',
    html: `<h2>¡Bienvenido a Artiefy, ${username}!</h2>
      <p>Estas son tus credenciales de acceso:</p>
      <ul><li><strong>Correo:</strong> ${to}</li>
      <li><strong>Contraseña:</strong> <code>${safe}</code></li></ul>
      <p>Ingresa en <a href="https://artiefy.com/sign-in">artiefy.com/sign-in</a> y cambia tu contraseña.</p>
      <p>Equipo de Artiefy 🎨</p>`,
    text: `Bienvenido a Artiefy, ${username}!\nCorreo: ${to}\nContrasena: ${password}\nhttps://artiefy.com/sign-in`,
  });
}

interface Fila {
  nombres?: string;
  apellidos?: string;
  email?: string;
  phone?: string;
  identificacion?: string;
  modalidad?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    rows?: Fila[];
    programa?: string;
  } | null;
  const rows = Array.isArray(body?.rows) ? body!.rows : [];
  if (!Number.isFinite(grupoId) || rows.length === 0) {
    return NextResponse.json(
      { error: 'Sin filas para procesar' },
      { status: 400 }
    );
  }

  const [grupo] = await db
    .select({ programa: grupos.programa })
    .from(grupos)
    .where(eq(grupos.id, grupoId))
    .limit(1);
  if (!grupo) {
    return NextResponse.json({ error: 'Hoja no encontrada' }, { status: 404 });
  }
  const programa = body?.programa?.trim() || grupo.programa || null;

  const cursoRows = await db
    .select({ courseId: grupoCursos.courseId })
    .from(grupoCursos)
    .where(eq(grupoCursos.grupoId, grupoId))
    .limit(1);
  const courseId = cursoRows[0]?.courseId ?? null;

  const matricularCurso = async (userId: string) => {
    if (courseId == null) return;
    const existe = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
      )
      .limit(1);
    if (existe.length === 0) {
      await db.insert(enrollments).values({
        userId,
        courseId,
        enrolledAt: new Date(),
        completed: false,
      });
    }
  };

  let creados = 0;
  let agregados = 0; // ya existían, solo se agregaron a la hoja
  const errores: { fila: number; email: string; motivo: string }[] = [];

  const fin = new Date();
  fin.setFullYear(fin.getFullYear() + 1);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const nombres = (r.nombres ?? '').trim();
    const apellidos = (r.apellidos ?? '').trim();
    const email = (r.email ?? '').trim().toLowerCase();
    const phone = (r.phone ?? '').trim() || null;
    const identificacionNumero = (r.identificacion ?? '').trim() || null;
    const modalidad = (r.modalidad ?? '').trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.push({
        fila: i + 1,
        email: r.email ?? '',
        motivo: 'Correo inválido',
      });
      continue;
    }

    try {
      // ¿Ya existe por correo?
      const [existente] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1);

      if (existente) {
        await db
          .insert(grupoEstudiantes)
          .values({ grupoId, userId: existente.id })
          .onConflictDoNothing();
        await matricularCurso(existente.id);
        agregados++;
        continue;
      }

      if (!nombres) {
        errores.push({ fila: i + 1, email, motivo: 'Falta el nombre' });
        continue;
      }

      const created = await createUser(
        nombres,
        apellidos,
        email,
        'estudiante',
        'active',
        fin.toISOString()
      );
      if (!created) {
        // Existe en Clerk pero no en BD: intenta agregar por email igualmente.
        errores.push({ fila: i + 1, email, motivo: 'Ya registrado en Clerk' });
        continue;
      }

      const userId = created.user.id;
      await db.insert(users).values({
        id: userId,
        role: 'estudiante',
        name: `${nombres} ${apellidos}`.trim(),
        email,
        phone,
        identificacionNumero,
        programa,
        modalidad,
        planType: 'Premium',
        subscriptionStatus: 'activo',
        subscriptionEndDate: fin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await matricularCurso(userId);
      await db
        .insert(grupoEstudiantes)
        .values({ grupoId, userId })
        .onConflictDoNothing();

      let correoOk = true;
      try {
        await enviarCredenciales(
          email,
          created.user.username ?? nombres,
          created.generatedPassword
        );
      } catch {
        correoOk = false;
      }
      try {
        await db.insert(credentialsDeliveryLogs).values({
          userId,
          usuario: created.user.username ?? nombres,
          contrasena: created.generatedPassword,
          correo: email,
          nota: correoOk
            ? 'Alta masiva en grupo — credenciales enviadas'
            : 'Alta masiva en grupo — el correo NO se pudo enviar',
        });
      } catch {
        /* no bloquea */
      }
      creados++;
    } catch (e) {
      console.error('[GRUPOS] alta-masiva fila', i + 1, e);
      errores.push({ fila: i + 1, email, motivo: 'Error al crear' });
    }
  }

  return NextResponse.json({ ok: true, creados, agregados, errores });
}
