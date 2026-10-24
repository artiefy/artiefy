/**
 * POST /api/super-admin/grupos/[id]/alta-estudiante
 *
 * Da de alta un estudiante NUEVO desde la fila de la planilla (estilo Excel):
 *  - crea el usuario en Clerk + BD (igual que la inscripción),
 *  - le envía por correo su cuenta y contraseña,
 *  - lo matricula al PROGRAMA de la hoja,
 *  - si la hoja tiene un CURSO asignado, también lo matricula a ese curso,
 *  - lo agrega como miembro de la hoja.
 *
 * Body: { nombres, apellidos?, identificacionNumero?, email, phone?, modalidad? }
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { db } from '~/server/db';
import {
  courses,
  credentialsDeliveryLogs,
  enrollments,
  grupoCursos,
  grupoEstudiantes,
  grupoEstudiantesPendientes,
  grupoProgramas,
  grupos,
  programas,
  users,
} from '~/server/db/schema';
import { matricularEnCurso } from '~/server/lib/grupos-matricula';
import {
  sincronizarEstudiantesAgregados,
  sincronizarProgramasAgregados,
} from '~/server/lib/grupos-programas-sync';
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
    html: `
      <h2>¡Bienvenido a Artiefy, ${username}!</h2>
      <p>Estas son tus credenciales de acceso:</p>
      <ul>
        <li><strong>Correo (con esto inicias sesión):</strong> ${to}</li>
        <li><strong>Contraseña:</strong> <code>${safe}</code></li>
      </ul>
      <p style="background:#eef6ff;border-left:4px solid #2563eb;padding:8px 12px;">
        Para entrar, usa tu <strong>correo electrónico</strong> y la contraseña de
        arriba. El nombre de usuario <em>${username}</em> es solo para mostrar tu
        perfil; no sirve para iniciar sesión.
      </p>
      <p>Ingresa en <a href="https://artiefy.com/sign-in" target="_blank">artiefy.com/sign-in</a> y cambia tu contraseña lo antes posible.</p>
      <hr/>
      <p>Equipo de Artiefy 🎨</p>
    `,
    text: `Bienvenido a Artiefy, ${username}!\n\nCorreo (con esto inicias sesion): ${to}\nContrasena: ${password}\n\nIngresa en https://artiefy.com/sign-in y cambia tu contrasena.`,
  });
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
    nombres?: string;
    apellidos?: string;
    identificacionNumero?: string;
    email?: string;
    phone?: string;
    modalidad?: string;
    observaciones?: string;
    programa?: string;
    existingUserId?: string;
    pendingId?: number;
  } | null;

  const existingUserId = body?.existingUserId?.trim() || null;
  const programaBody = body?.programa?.trim() || null;
  const pendingId =
    body?.pendingId != null && Number.isInteger(Number(body.pendingId))
      ? Number(body.pendingId)
      : null;
  let nombres = body?.nombres?.trim() ?? '';
  let apellidos = body?.apellidos?.trim() ?? '';
  const email = body?.email?.trim().toLowerCase() ?? '';
  let phone = body?.phone?.trim() || null;
  let identificacionNumero = body?.identificacionNumero?.trim() || null;
  let modalidad = body?.modalidad?.trim() || null;
  let observaciones = body?.observaciones?.trim() || null;

  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }
  if (pendingId != null) {
    try {
      const [pendiente] = await db
        .select()
        .from(grupoEstudiantesPendientes)
        .where(
          and(
            eq(grupoEstudiantesPendientes.id, pendingId),
            eq(grupoEstudiantesPendientes.grupoId, grupoId)
          )
        )
        .limit(1);
      if (!pendiente) {
        return NextResponse.json(
          { error: 'Estudiante pendiente no encontrado' },
          { status: 404 }
        );
      }
      const [primerNombre = '', ...restoNombres] = pendiente.name
        .trim()
        .split(/\s+/);
      nombres = primerNombre;
      apellidos = restoNombres.join(' ');
      phone = pendiente.phone;
      identificacionNumero = pendiente.identificacionNumero;
      modalidad = pendiente.modalidad;
      observaciones = pendiente.observaciones;
    } catch (error) {
      console.error('[GRUPOS] cargar estudiante pendiente:', error);
      return NextResponse.json(
        { error: 'No se pudo cargar el estudiante pendiente' },
        { status: 500 }
      );
    }
  }

  if (!existingUserId && !nombres) {
    return NextResponse.json(
      { error: 'El nombre es obligatorio' },
      { status: 400 }
    );
  }
  if (!existingUserId && !email) {
    if (pendingId != null) {
      return NextResponse.json(
        { error: 'Agrega un correo para crear la cuenta' },
        { status: 400 }
      );
    }
    try {
      const [pendiente] = await db
        .insert(grupoEstudiantesPendientes)
        .values({
          grupoId,
          name: `${nombres} ${apellidos}`.trim(),
          identificacionNumero,
          phone,
          modalidad,
        })
        .returning({ id: grupoEstudiantesPendientes.id });
      return NextResponse.json({
        ok: true,
        pendiente: true,
        pendingId: pendiente?.id,
      });
    } catch (error) {
      console.error('[GRUPOS] guardar estudiante pendiente:', error);
      return NextResponse.json(
        { error: 'No se pudo guardar el estudiante pendiente' },
        { status: 500 }
      );
    }
  }
  if (!existingUserId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
  }

  try {
    // Datos de la hoja: programa y curso asignado.
    const [grupo] = await db
      .select({ programa: grupos.programa, courseId: grupos.courseId })
      .from(grupos)
      .where(eq(grupos.id, grupoId))
      .limit(1);
    if (!grupo) {
      return NextResponse.json(
        { error: 'Hoja no encontrada' },
        { status: 404 }
      );
    }
    const programa = programaBody ?? grupo.programa ?? null;

    const cursoRows = await db
      .select({ courseId: grupoCursos.courseId })
      .from(grupoCursos)
      .where(eq(grupoCursos.grupoId, grupoId));
    const courseIds = [
      ...new Set(
        [grupo.courseId, ...cursoRows.map((curso) => curso.courseId)].filter(
          (id): id is number => id != null
        )
      ),
    ];
    const courseId = courseIds[0] ?? null;

    // ── Estudiante YA EXISTENTE: solo se agrega a la hoja y se matricula al
    // curso (sin crear cuenta ni enviar credenciales). ────────────────────
    if (existingUserId) {
      const [u] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          identificacionNumero: users.identificacionNumero,
          modalidad: users.modalidad,
          programa: users.programa,
        })
        .from(users)
        .where(eq(users.id, existingUserId))
        .limit(1);
      if (!u) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      await db
        .insert(grupoEstudiantes)
        .values({ grupoId, userId: existingUserId })
        .onConflictDoNothing();
      await sincronizarEstudiantesAgregados(grupoId, [existingUserId]);

      if (courseId != null) {
        const existe = await db
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, existingUserId),
              eq(enrollments.courseId, courseId)
            )
          )
          .limit(1);
        if (existe.length === 0) {
          await db.insert(enrollments).values({
            userId: existingUserId,
            courseId,
            enrolledAt: new Date(),
            completed: false,
          });
        }
      }

      return NextResponse.json({
        ok: true,
        existente: true,
        correoOk: null,
        miembro: {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          identificacionNumero: u.identificacionNumero,
          programa: u.programa,
          modalidad: u.modalidad,
          carteraStatus: null,
        },
      });
    }

    // Crea el usuario en Clerk (genera contraseña).
    const fin = new Date();
    fin.setFullYear(fin.getFullYear() + 1);
    const created = await createUser(
      nombres,
      apellidos,
      email,
      'estudiante',
      'active',
      fin.toISOString()
    );
    if (!created) {
      return NextResponse.json(
        { error: 'Ese correo ya está registrado' },
        { status: 409 }
      );
    }

    const userId = created.user.id;
    const fullName = `${nombres} ${apellidos}`.trim();

    // Inserta en la BD (activo, Premium, con el programa de la hoja).
    await db.insert(users).values({
      id: userId,
      role: 'estudiante',
      name: fullName,
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

    // Matricula en todos los cursos asociados a esta hoja.
    for (const cursoId of courseIds) {
      await matricularEnCurso(cursoId, [userId]);
    }

    // Agrega como miembro de la hoja.
    await db
      .insert(grupoEstudiantes)
      .values({ grupoId, userId, modalidad, observaciones })
      .onConflictDoNothing();
    await sincronizarEstudiantesAgregados(grupoId, [userId]);
    const programasHoja = await db
      .select({ programaId: grupoProgramas.programaId })
      .from(grupoProgramas)
      .where(eq(grupoProgramas.grupoId, grupoId));
    const programaIds = programasHoja.map((programa) => programa.programaId);
    if (programaIds.length === 0 && programa) {
      const [programaHoja] = await db
        .select({ id: programas.id })
        .from(programas)
        .where(eq(programas.title, programa))
        .limit(1);
      if (programaHoja) programaIds.push(programaHoja.id);
    }
    await sincronizarProgramasAgregados(grupoId, programaIds);
    if (pendingId != null) {
      await db
        .delete(grupoEstudiantesPendientes)
        .where(
          and(
            eq(grupoEstudiantesPendientes.id, pendingId),
            eq(grupoEstudiantesPendientes.grupoId, grupoId)
          )
        );
    }

    // Envía las credenciales (no bloquea el alta si el correo falla).
    const usernameFinal = created.user.username ?? nombres;
    let correoOk = true;
    try {
      await enviarCredenciales(email, usernameFinal, created.generatedPassword);
    } catch (e) {
      correoOk = false;
      console.error('[GRUPOS] alta-estudiante email:', e);
    }

    // Guarda las credenciales para /dashboard/super-admin/credentials-logs.
    try {
      await db.insert(credentialsDeliveryLogs).values({
        userId,
        usuario: usernameFinal,
        contrasena: created.generatedPassword,
        correo: email,
        nota: correoOk
          ? 'Alta desde planilla de grupos — credenciales enviadas'
          : 'Alta desde planilla de grupos — el correo NO se pudo enviar',
      });
    } catch (e) {
      console.error('[GRUPOS] alta-estudiante log credenciales:', e);
    }

    // Título del curso (para responder al front, opcional).
    let cursoTitulo: string | null = null;
    if (courseId != null) {
      const c = await db
        .select({ title: courses.title })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);
      cursoTitulo = c[0]?.title ?? null;
    }

    return NextResponse.json({
      ok: true,
      correoOk,
      miembro: {
        id: userId,
        name: fullName,
        email,
        phone,
        identificacionNumero,
        programa,
        modalidad,
        carteraStatus: null,
      },
      matriculadoEnCurso: cursoTitulo,
    });
  } catch (error) {
    console.error('[GRUPOS] alta-estudiante:', error);
    return NextResponse.json(
      { error: 'No se pudo crear el estudiante' },
      { status: 500 }
    );
  }
}
