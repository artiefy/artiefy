/**
 * /api/super-admin/grupos/[id]
 *
 * GET    — detalle del grupo: datos, miembros, hojas (cursos asignados con su
 *          enlace de Teams), sesiones por curso y asistencia.
 * PATCH  — renombra el grupo.
 * DELETE — elimina SOLO esta hoja (con sus miembros/sesiones/asistencia). Si era
 *          la raíz y hay más hojas, la hoja más antigua pasa a ser la raíz.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { asc, eq, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '~/server/db';
import {
  courses,
  grupoAsistencia,
  grupoCursos,
  grupoEstudiantes,
  grupoProgramas,
  grupos,
  grupoSesiones,
  materias,
  programas,
  scheduleOptions,
  spaceOptions,
  userCartera,
  users,
} from '~/server/db/schema';
import { sincronizarHojasEliminadas } from '~/server/lib/grupos-programas-sync';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }

  try {
    const [grupoBase] = await db
      .select({ id: grupos.id, parentId: grupos.parentId })
      .from(grupos)
      .where(eq(grupos.id, grupoId))
      .limit(1);

    if (!grupoBase) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    // Familia = raíz (contenedor) + sus hijas. La raíz también es una hoja.
    const familyRoot = grupoBase.parentId ?? grupoBase.id;
    const familiaRows = await db
      .select({
        id: grupos.id,
        nombre: grupos.nombre,
        parentId: grupos.parentId,
        programa: grupos.programa,
        empresa: grupos.empresa,
        teamsJoinUrl: grupos.teamsJoinUrl,
        createdAt: grupos.createdAt,
      })
      .from(grupos)
      .where(or(eq(grupos.id, familyRoot), eq(grupos.parentId, familyRoot)))
      .orderBy(asc(grupos.createdAt));

    const rootNombre =
      familiaRows.find((f) => f.id === familyRoot)?.nombre ?? '';
    // Raíz primero, luego las hijas por fecha de creación.
    const ordenadas = [
      ...familiaRows.filter((f) => f.id === familyRoot),
      ...familiaRows.filter((f) => f.id !== familyRoot),
    ];
    const ids = ordenadas.map((f) => f.id);

    // Alias para resolver el educador cuando courses.instructor es un id de
    // usuario (Clerk) en vez de un nombre.
    const educadorUser = alias(users, 'educador_user');

    // Todo en paralelo para TODAS las hojas de la familia.
    const [
      miembrosRows,
      sesionesRows,
      cursoRows,
      cursosDisponibles,
      programasRows,
    ] = await Promise.all([
      db
        .select({
          grupoId: grupoEstudiantes.grupoId,
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          identificacionNumero: users.identificacionNumero,
          programa: users.programa,
          modalidad: sql<
            string | null
          >`coalesce(${grupoEstudiantes.modalidad}, ${users.modalidad})`,
          observaciones: grupoEstudiantes.observaciones,
          carteraStatus: userCartera.status,
        })
        .from(grupoEstudiantes)
        .innerJoin(users, eq(grupoEstudiantes.userId, users.id))
        .leftJoin(userCartera, eq(userCartera.userId, users.id))
        .where(inArray(grupoEstudiantes.grupoId, ids))
        .orderBy(asc(users.name)),
      db
        .select({
          id: grupoSesiones.id,
          grupoId: grupoSesiones.grupoId,
          fecha: grupoSesiones.fecha,
          titulo: grupoSesiones.titulo,
          courseId: grupoSesiones.courseId,
        })
        .from(grupoSesiones)
        .where(inArray(grupoSesiones.grupoId, ids))
        .orderBy(asc(grupoSesiones.fecha)),
      db
        .select({
          grupoId: grupoCursos.grupoId,
          courseId: grupoCursos.courseId,
          title: courses.title,
          instructor: courses.instructor,
          educadorNombre: educadorUser.name,
          // IDs actuales (para preseleccionar los selects del encabezado).
          scheduleOptionId: courses.scheduleOptionId,
          spaceOptionId: courses.spaceOptionId,
          // El curso guarda horario/espacio como opción (schedule_options /
          // space_options); el texto viejo queda de respaldo.
          horario: sql<
            string | null
          >`coalesce(${scheduleOptions.name}, ${courses.horario})`,
          espacios: sql<
            string | null
          >`coalesce(${spaceOptions.name}, ${courses.espacios})`,
        })
        .from(grupoCursos)
        .innerJoin(courses, eq(grupoCursos.courseId, courses.id))
        .leftJoin(educadorUser, eq(educadorUser.id, courses.instructor))
        .leftJoin(
          scheduleOptions,
          eq(scheduleOptions.id, courses.scheduleOptionId)
        )
        .leftJoin(spaceOptions, eq(spaceOptions.id, courses.spaceOptionId))
        .where(inArray(grupoCursos.grupoId, ids)),
      // Cursos con los programas a los que pertenecen
      // (courses ↔ materias(courseid, programaId) ↔ programas), para que el
      // front liste solo los del programa de la hoja.
      db
        .selectDistinct({
          id: courses.id,
          title: courses.title,
          programa: programas.title,
        })
        .from(courses)
        .innerJoin(materias, eq(materias.courseid, courses.id))
        .innerJoin(programas, eq(programas.id, materias.programaId))
        .orderBy(asc(courses.title)),
      db
        .select({ id: programas.id, title: programas.title })
        .from(programas)
        .orderBy(asc(programas.title)),
    ]);

    // Programas por hoja (grupo_programas). Si la tabla aún no existe, cae al
    // programa de texto legado de cada hoja.
    const programasPorHoja = new Map<number, number[]>();
    try {
      const rows = await db
        .select({
          grupoId: grupoProgramas.grupoId,
          programaId: grupoProgramas.programaId,
        })
        .from(grupoProgramas)
        .where(inArray(grupoProgramas.grupoId, ids));
      for (const r of rows) {
        programasPorHoja.set(r.grupoId, [
          ...(programasPorHoja.get(r.grupoId) ?? []),
          r.programaId,
        ]);
      }
    } catch (e) {
      console.error('[GRUPOS] grupo_programas no disponible:', e);
    }
    const idPorTitulo = new Map(programasRows.map((p) => [p.title, p.id]));

    // Agrupa por hoja (dedup por alumno, por si hay varias filas de cartera).
    type Miembro = Omit<(typeof miembrosRows)[number], 'grupoId'>;
    const miembrosPorHoja = new Map<number, Miembro[]>();
    const vistos = new Set<string>();
    for (const r of miembrosRows) {
      const clave = `${r.grupoId}:${r.id}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      const { grupoId: gid, ...m } = r;
      const lista = miembrosPorHoja.get(gid) ?? [];
      lista.push(m);
      miembrosPorHoja.set(gid, lista);
    }

    const sesionesPorHoja = new Map<
      number,
      {
        id: number;
        fecha: string;
        titulo: string | null;
        courseId: number | null;
      }[]
    >();
    const sesionAGrupo = new Map<number, number>();
    for (const s of sesionesRows) {
      sesionAGrupo.set(s.id, s.grupoId);
      const lista = sesionesPorHoja.get(s.grupoId) ?? [];
      lista.push({
        id: s.id,
        fecha: s.fecha,
        titulo: s.titulo,
        courseId: s.courseId,
      });
      sesionesPorHoja.set(s.grupoId, lista);
    }

    // Asistencia por hoja → { sesionId: { userId: estado } }
    const asistenciaPorHoja = new Map<
      number,
      Record<number, Record<string, string>>
    >();
    const allSesionIds = sesionesRows.map((s) => s.id);
    if (allSesionIds.length > 0) {
      const marcas = await db
        .select({
          sesionId: grupoAsistencia.sesionId,
          userId: grupoAsistencia.userId,
          estado: grupoAsistencia.estado,
        })
        .from(grupoAsistencia)
        .where(inArray(grupoAsistencia.sesionId, allSesionIds));
      for (const m of marcas) {
        const gid = sesionAGrupo.get(m.sesionId);
        if (gid == null) continue;
        const porHoja = asistenciaPorHoja.get(gid) ?? {};
        porHoja[m.sesionId] ??= {};
        porHoja[m.sesionId][m.userId] = m.estado;
        asistenciaPorHoja.set(gid, porHoja);
      }
    }

    // Curso (uno por hoja) → cabecera.
    const cursoPorHoja = new Map<
      number,
      {
        courseId: number;
        curso: string;
        educador: string | null;
        horario: string | null;
        espacio: string | null;
        instructorId: string | null;
        scheduleOptionId: number | null;
        spaceOptionId: number | null;
      }
    >();
    for (const c of cursoRows) {
      if (cursoPorHoja.has(c.grupoId)) continue;
      cursoPorHoja.set(c.grupoId, {
        courseId: c.courseId,
        curso: c.title,
        educador: c.educadorNombre ?? c.instructor ?? null,
        horario: c.horario ?? null,
        espacio: c.espacios ?? null,
        instructorId: c.instructor ?? null,
        scheduleOptionId: c.scheduleOptionId ?? null,
        spaceOptionId: c.spaceOptionId ?? null,
      });
    }

    const hojas = ordenadas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      parentId: f.parentId,
      programa: f.programa,
      programasIds:
        programasPorHoja.get(f.id) ??
        (f.programa && idPorTitulo.has(f.programa)
          ? [idPorTitulo.get(f.programa)!]
          : []),
      empresa: f.empresa,
      teamsJoinUrl: f.teamsJoinUrl,
      cursoHoja: cursoPorHoja.get(f.id) ?? null,
      miembros: miembrosPorHoja.get(f.id) ?? [],
      sesiones: sesionesPorHoja.get(f.id) ?? [],
      asistencia: asistenciaPorHoja.get(f.id) ?? {},
    }));

    // Un curso por fila con la lista de programas en los que está.
    const cursosPorId = new Map<
      number,
      { id: number; title: string; programas: string[] }
    >();
    for (const c of cursosDisponibles) {
      const actual = cursosPorId.get(c.id);
      if (actual) actual.programas.push(c.programa);
      else
        cursosPorId.set(c.id, {
          id: c.id,
          title: c.title,
          programas: [c.programa],
        });
    }

    return NextResponse.json({
      rootNombre,
      hojas,
      cursosDisponibles: [...cursosPorId.values()],
      programas: programasRows.map((p) => p.title),
      programasOpciones: programasRows,
    });
  } catch (error) {
    console.error('[GRUPOS] detail:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el grupo' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    nombre?: string;
    espacio?: string | null;
    empresa?: string | null;
    educador?: string | null;
    horario?: string | null;
    curso?: string | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  } | null;
  if (!Number.isFinite(grupoId) || !body) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  // Solo escribe los campos que vengan en el body (edición parcial de la planilla).
  const cambios: Record<string, unknown> = { updatedAt: new Date() };
  const limpiar = (v: unknown) =>
    typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : null;
  if (body.nombre !== undefined) {
    const nombre = body.nombre.trim();
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre no puede quedar vacío' },
        { status: 400 }
      );
    }
    cambios.nombre = nombre;
  }
  if (body.espacio !== undefined) cambios.espacio = limpiar(body.espacio);
  if (body.empresa !== undefined) cambios.empresa = limpiar(body.empresa);
  if (body.educador !== undefined) cambios.educador = limpiar(body.educador);
  if (body.horario !== undefined) cambios.horario = limpiar(body.horario);
  if (body.curso !== undefined) cambios.curso = limpiar(body.curso);
  if (body.fechaInicio !== undefined)
    cambios.fechaInicio = limpiar(body.fechaInicio);
  if (body.fechaFin !== undefined) cambios.fechaFin = limpiar(body.fechaFin);

  try {
    await db.update(grupos).set(cambios).where(eq(grupos.id, grupoId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] patch:', error);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }
  try {
    const [hoja] = await db
      .select({ id: grupos.id, parentId: grupos.parentId })
      .from(grupos)
      .where(eq(grupos.id, grupoId))
      .limit(1);
    if (!hoja) {
      return NextResponse.json(
        { error: 'Hoja no encontrada' },
        { status: 404 }
      );
    }
    const ids = [grupoId];

    // Si es la raíz y tiene hojas, la más antigua pasa a ser la nueva raíz
    // (las demás cuelgan de ella) para no borrar la familia completa.
    let nuevaRaizId: number | null = null;
    if (hoja.parentId == null) {
      const hijas = await db
        .select({ id: grupos.id })
        .from(grupos)
        .where(eq(grupos.parentId, grupoId))
        .orderBy(asc(grupos.createdAt));
      const [nueva, ...resto] = hijas;
      if (nueva) {
        nuevaRaizId = nueva.id;
        await db
          .update(grupos)
          .set({ parentId: null, updatedAt: new Date() })
          .where(eq(grupos.id, nueva.id));
        if (resto.length > 0) {
          await db
            .update(grupos)
            .set({ parentId: nueva.id })
            .where(
              inArray(
                grupos.id,
                resto.map((h) => h.id)
              )
            );
        }
      }
    }

    // Antes del cascade: quita los orígenes y limpia matrículas sin respaldo.
    await sincronizarHojasEliminadas(ids);

    // Borra los hijos explícitamente por si la BD no tiene ON DELETE CASCADE
    // (las tablas se crearon con SQL manual). La asistencia cuelga de las
    // sesiones, así que se resuelven esas primero.
    const sesiones = await db
      .select({ id: grupoSesiones.id })
      .from(grupoSesiones)
      .where(inArray(grupoSesiones.grupoId, ids));
    const sesionIds = sesiones.map((s) => s.id);
    if (sesionIds.length > 0) {
      await db
        .delete(grupoAsistencia)
        .where(inArray(grupoAsistencia.sesionId, sesionIds));
    }
    await db.delete(grupoSesiones).where(inArray(grupoSesiones.grupoId, ids));
    await db
      .delete(grupoEstudiantes)
      .where(inArray(grupoEstudiantes.grupoId, ids));
    await db.delete(grupoCursos).where(inArray(grupoCursos.grupoId, ids));
    await db.delete(grupos).where(eq(grupos.id, grupoId));
    return NextResponse.json({ ok: true, nuevaRaizId });
  } catch (error) {
    console.error('[GRUPOS] delete:', error);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}
