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
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '~/server/db';
import {
  courses,
  grupoAsistencia,
  grupoCursos,
  grupoEstudiantes,
  grupoEstudiantesPendientes,
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
import {
  cursosDeGrupo,
  educadorPuedeAccederAGrupo,
  esAdministradorDeGrupos,
} from '~/server/lib/grupo-asistencia-access';
import { rechazarSiHojaArchivada } from '~/server/lib/grupo-hoja-archivada';
import { sincronizarHojasEliminadas } from '~/server/lib/grupos-programas-sync';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';
import { getApiSession } from '~/server/utils/apiAuth';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  if (!esAdministradorDeGrupos(session.role) && session.role !== 'educador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }
  const courseIdParam = request.nextUrl.searchParams.get('courseId');
  const courseId = courseIdParam == null ? null : Number(courseIdParam);
  const esEmbebido = courseId != null;
  if (esEmbebido && (!Number.isInteger(courseId) || courseId <= 0)) {
    return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
  }
  if (session.role === 'educador') {
    if (
      courseId == null ||
      !(await isCourseOwnedByEducator(courseId, session.userId)) ||
      !(await educadorPuedeAccederAGrupo(grupoId, session.userId, courseId))
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
  } else if (courseId != null) {
    const cursoIds = await cursosDeGrupo(grupoId);
    if (!cursoIds.includes(courseId)) {
      return NextResponse.json(
        { error: 'Curso no asociado al grupo' },
        { status: 403 }
      );
    }
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
        nombreHoja: grupos.nombreHoja,
        hojaArchivada: grupos.hojaArchivada,
        parentId: grupos.parentId,
        programa: grupos.programa,
        empresa: grupos.empresa,
        teamsJoinUrl: grupos.teamsJoinUrl,
        createdAt: grupos.createdAt,
      })
      .from(grupos)
      .where(or(eq(grupos.id, familyRoot), eq(grupos.parentId, familyRoot)))
      // id desempata: las hojas copiadas en una misma transacción comparten
      // createdAt.
      .orderBy(asc(grupos.createdAt), asc(grupos.id));

    const rootNombre =
      familiaRows.find((f) => f.id === familyRoot)?.nombre ?? '';
    // Raíz primero, luego las hijas por fecha de creación.
    const familiaOrdenada = [
      ...familiaRows.filter((f) => f.id === familyRoot),
      ...familiaRows.filter((f) => f.id !== familyRoot),
    ];
    const ordenadas = esEmbebido
      ? familiaOrdenada.filter((f) => f.id === grupoId)
      : familiaOrdenada;
    const ids = ordenadas.map((f) => f.id);

    // Alias para resolver el educador cuando courses.instructor es un id de
    // usuario (Clerk) en vez de un nombre.
    const educadorUser = alias(users, 'educador_user');

    // Todo en paralelo para TODAS las hojas de la familia.
    const [
      miembrosRows,
      pendientesRows,
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
          enrollmentStatus: users.enrollmentStatus,
        })
        .from(grupoEstudiantes)
        .innerJoin(users, eq(grupoEstudiantes.userId, users.id))
        .leftJoin(userCartera, eq(userCartera.userId, users.id))
        .where(inArray(grupoEstudiantes.grupoId, ids))
        .orderBy(asc(users.name)),
      db
        .select({
          id: grupoEstudiantesPendientes.id,
          grupoId: grupoEstudiantesPendientes.grupoId,
          name: grupoEstudiantesPendientes.name,
          identificacionNumero: grupoEstudiantesPendientes.identificacionNumero,
          phone: grupoEstudiantesPendientes.phone,
          modalidad: grupoEstudiantesPendientes.modalidad,
          observaciones: grupoEstudiantesPendientes.observaciones,
        })
        .from(grupoEstudiantesPendientes)
        .where(inArray(grupoEstudiantesPendientes.grupoId, ids))
        .orderBy(asc(grupoEstudiantesPendientes.createdAt)),
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
        .where(
          esEmbebido && courseId != null
            ? and(
                inArray(grupoCursos.grupoId, ids),
                eq(grupoCursos.courseId, courseId)
              )
            : inArray(grupoCursos.grupoId, ids)
        ),
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

    if (esEmbebido && courseId != null && cursoRows.length === 0) {
      const cursosLegados = await db
        .select({
          grupoId: grupos.id,
          courseId: courses.id,
          title: courses.title,
          instructor: courses.instructor,
          educadorNombre: educadorUser.name,
          scheduleOptionId: courses.scheduleOptionId,
          spaceOptionId: courses.spaceOptionId,
          horario: sql<
            string | null
          >`coalesce(${scheduleOptions.name}, ${courses.horario})`,
          espacios: sql<
            string | null
          >`coalesce(${spaceOptions.name}, ${courses.espacios})`,
        })
        .from(grupos)
        .innerJoin(courses, eq(grupos.courseId, courses.id))
        .leftJoin(educadorUser, eq(educadorUser.id, courses.instructor))
        .leftJoin(
          scheduleOptions,
          eq(scheduleOptions.id, courses.scheduleOptionId)
        )
        .leftJoin(spaceOptions, eq(spaceOptions.id, courses.spaceOptionId))
        .where(and(eq(grupos.id, grupoId), eq(grupos.courseId, courseId)));
      cursoRows.push(...cursosLegados);
    }

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
    type Miembro = Omit<(typeof miembrosRows)[number], 'grupoId'> & {
      pendingId?: number;
      pendiente?: boolean;
    };
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
    for (const pendiente of pendientesRows) {
      const lista = miembrosPorHoja.get(pendiente.grupoId) ?? [];
      lista.push({
        id: `pending-${pendiente.id}`,
        name: pendiente.name,
        email: '',
        phone: pendiente.phone,
        identificacionNumero: pendiente.identificacionNumero,
        programa: null,
        modalidad: pendiente.modalidad,
        observaciones: pendiente.observaciones,
        carteraStatus: null,
        enrollmentStatus: null,
        pendingId: pendiente.id,
        pendiente: true,
      });
      miembrosPorHoja.set(pendiente.grupoId, lista);
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
      // La pestaña de la raíz puede tener su propio nombre (la tarjeta usa
      // rootNombre).
      nombre: f.nombreHoja ?? f.nombre,
      parentId: f.parentId,
      hojaArchivada: f.hojaArchivada,
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

    const programasVisibles =
      session.role === 'educador'
        ? programasRows.filter(
            (programa) =>
              ids.some((idHoja) =>
                (programasPorHoja.get(idHoja) ?? []).includes(programa.id)
              ) || ordenadas.some((hoja) => hoja.programa === programa.title)
          )
        : programasRows;
    const cursosVisibles =
      session.role === 'educador'
        ? [...cursosPorId.values()].filter((curso) => curso.id === courseId)
        : [...cursosPorId.values()];

    return NextResponse.json({
      rootNombre,
      hojas,
      canAdminister: esAdministradorDeGrupos(session.role),
      cursosDisponibles: cursosVisibles,
      programas: programasVisibles.map((p) => p.title),
      programasOpciones: programasVisibles,
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
    nombreHoja?: string | null;
    espacio?: string | null;
    empresa?: string | null;
    educador?: string | null;
    horario?: string | null;
    curso?: string | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    archivado?: boolean;
  } | null;
  if (!Number.isFinite(grupoId) || !body) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  // Una hoja archivada es de solo lectura; solo se permite lo que es del grupo
  // completo (archivarlo y el nombre de la tarjeta).
  if (Object.keys(body).some((k) => k !== 'archivado' && k !== 'nombre')) {
    const rechazo = await rechazarSiHojaArchivada(grupoId);
    if (rechazo) return rechazo;
  }

  // Solo escribe los campos que vengan en el body (edición parcial de la planilla).
  const cambios: Record<string, unknown> = { updatedAt: new Date() };
  const limpiar = (v: unknown) =>
    typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : null;
  const fechaValida = (valor: unknown) => {
    if (valor == null || valor === '') return true;
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return false;
    }
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    return (
      !Number.isNaN(fecha.getTime()) &&
      fecha.toISOString().slice(0, 10) === valor
    );
  };
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
  if (body.nombreHoja !== undefined)
    cambios.nombreHoja = limpiar(body.nombreHoja);
  if (body.espacio !== undefined) cambios.espacio = limpiar(body.espacio);
  if (body.empresa !== undefined) cambios.empresa = limpiar(body.empresa);
  if (body.educador !== undefined) cambios.educador = limpiar(body.educador);
  if (body.horario !== undefined) cambios.horario = limpiar(body.horario);
  if (body.curso !== undefined) cambios.curso = limpiar(body.curso);
  if (body.fechaInicio !== undefined)
    cambios.fechaInicio = limpiar(body.fechaInicio);
  if (body.fechaFin !== undefined) cambios.fechaFin = limpiar(body.fechaFin);
  if (body.archivado !== undefined) {
    if (typeof body.archivado !== 'boolean') {
      return NextResponse.json(
        { error: 'El estado de archivo es inválido' },
        { status: 400 }
      );
    }
    cambios.archivado = body.archivado;
  }
  if (!fechaValida(body.fechaInicio) || !fechaValida(body.fechaFin)) {
    return NextResponse.json(
      { error: 'Las fechas no son válidas' },
      { status: 400 }
    );
  }

  try {
    const [actual] = await db
      .select({
        id: grupos.id,
        fechaInicio: grupos.fechaInicio,
        fechaFin: grupos.fechaFin,
      })
      .from(grupos)
      .where(eq(grupos.id, grupoId))
      .limit(1);
    if (!actual) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }
    const fechaInicio =
      body.fechaInicio === undefined
        ? actual.fechaInicio
        : limpiar(body.fechaInicio);
    const fechaFin =
      body.fechaFin === undefined ? actual.fechaFin : limpiar(body.fechaFin);
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      );
    }
    await db.update(grupos).set(cambios).where(eq(grupos.id, grupoId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] patch:', error);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}

// DELETE            → borra UNA hoja (si es la raíz, la hoja más antigua pasa
//                     a ser la raíz para no perder la familia).
// DELETE ?familia=1 → borra el GRUPO completo (la raíz y todas sus hojas);
//                     es lo que usa "Eliminar grupo" en el listado.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const familiaCompleta = request.nextUrl.searchParams.get('familia') === '1';
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

    if (familiaCompleta && hoja.parentId == null) {
      const hijas = await db
        .select({ id: grupos.id })
        .from(grupos)
        .where(eq(grupos.parentId, grupoId));
      ids.push(...hijas.map((h) => h.id));
    }

    // Si es la raíz y tiene hojas, la más antigua pasa a ser la nueva raíz
    // (las demás cuelgan de ella) para no borrar la familia completa.
    let nuevaRaizId: number | null = null;
    if (hoja.parentId == null && !familiaCompleta) {
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
    await db
      .delete(grupoEstudiantesPendientes)
      .where(inArray(grupoEstudiantesPendientes.grupoId, ids));
    await db.delete(grupoCursos).where(inArray(grupoCursos.grupoId, ids));
    await db.delete(grupos).where(inArray(grupos.id, ids));
    return NextResponse.json({ ok: true, nuevaRaizId });
  } catch (error) {
    console.error('[GRUPOS] delete:', error);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}
