import { Pool } from '@neondatabase/serverless';
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { env } from '~/env';
import * as schema from '~/server/db/schema';
import {
  academyActivities,
  academyCategorias,
  academyCourseInstructors,
  academyCourses,
  academyEspacios,
  academyHorarios,
  academyLessons,
  academyModalidades,
  academyNiveles,
  academyParametros,
  academyProgramaCursos,
  academyProgramas,
  academyTiposCertificacion,
  academyUsers,
  activities,
  categories,
  certificationTypes,
  courseInstructors,
  courses,
  lessons,
  materias,
  modalidades,
  nivel,
  parametros,
  programas,
  scheduleOptions,
  spaceOptions,
  users,
} from '~/server/db/schema';

import { type Academia, ErrorAcademia } from './academias';
import { registrarLog } from './logs';
import { agregarUsuario } from './usuarios';

import 'server-only';

// "Enviar a academia" desde el panel de Artiefy: copia usuarios, cursos (con
// sus clases, actividades y parámetros de evaluación) y programas de Artiefy
// a una academia. Las copias quedan independientes: editarlas en la academia
// no toca Artiefy. También "Duplicar" un curso dentro de Artiefy.
//
// Los archivos (portadas, videos, recursos) no se copian en S3: la copia usa
// las mismas claves.

type Tx = Parameters<
  Parameters<ReturnType<typeof drizzle<typeof schema>>['transaction']>[0]
>[0];

/** Corre `fn` en una transacción (Neon HTTP no las tiene). */
async function enTransaccion<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: env.POSTGRES_URL });
  try {
    const tdb = drizzle({ client: pool, schema });
    return await tdb.transaction(fn);
  } finally {
    await pool.end();
  }
}

// ------------------------------------------------------------ Usuarios ---

export interface ResultadoUsuario {
  email: string;
  estado: 'vinculado' | 'creado' | 'actualizado' | 'error';
  error?: string;
}

/**
 * Agrega cuentas de Artiefy a la academia con el rol dado. Las cuentas que ya
 * existen se vinculan (entran con su misma contraseña y reciben un aviso por
 * correo). Uno a uno, para que un correo malo no frene a los demás.
 */
export async function enviarUsuarios(
  academia: Academia,
  usuarios: { email: string; nombre: string }[],
  rol: schema.AcademyRole
): Promise<ResultadoUsuario[]> {
  const resultados: ResultadoUsuario[] = [];
  for (const u of usuarios.slice(0, 200)) {
    try {
      const r = await agregarUsuario(academia, {
        email: u.email,
        nombre: u.nombre || u.email,
        rol,
      });
      resultados.push({
        email: u.email,
        estado: r.vinculado ? 'vinculado' : r.creado ? 'creado' : 'actualizado',
      });
    } catch (error) {
      resultados.push({
        email: u.email,
        estado: 'error',
        error:
          error instanceof ErrorAcademia ? error.message : 'No se pudo agregar',
      });
    }
  }
  const ok = resultados.filter((r) => r.estado !== 'error').length;
  await registrarLog(
    academia.id,
    'Usuarios recibidos de Artiefy',
    `${ok} de ${resultados.length} (${rol})`
  );
  return resultados;
}

// -------------------------------------------------------------- Cursos ---

/** Id del catálogo de la academia con ese nombre (lo crea si no existe). */
async function catalogo(
  tx: Tx,
  tabla:
    | typeof academyCategorias
    | typeof academyModalidades
    | typeof academyNiveles
    | typeof academyHorarios
    | typeof academyEspacios
    | typeof academyTiposCertificacion,
  academyId: number,
  nombre: string | null | undefined
): Promise<number | null> {
  const name = nombre?.trim();
  if (!name) return null;
  await tx.insert(tabla).values({ academyId, name }).onConflictDoNothing();
  const [fila] = await tx
    .select({ id: tabla.id })
    .from(tabla)
    .where(and(eq(tabla.academyId, academyId), eq(tabla.name, name)))
    .limit(1);
  return fila?.id ?? null;
}

const nombreDe = async (
  tx: Tx,
  tabla:
    | typeof categories
    | typeof modalidades
    | typeof nivel
    | typeof scheduleOptions
    | typeof spaceOptions
    | typeof certificationTypes,
  id: number | null
) => {
  if (id == null) return null;
  const [fila] = await tx
    .select({ name: tabla.name })
    .from(tabla)
    .where(eq(tabla.id, id))
    .limit(1);
  return fila?.name ?? null;
};

/** Educadores (principal + course_instructors) de un curso de Artiefy. */
async function educadoresDe(tx: Tx, courseId: number, principal: string) {
  const extra = await tx
    .select({ id: courseInstructors.instructorId })
    .from(courseInstructors)
    .where(eq(courseInstructors.courseId, courseId));
  const ids = [...new Set([principal, ...extra.map((e) => e.id)])].filter(
    Boolean
  );
  if (ids.length === 0) return [];
  return tx
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, ids));
}

/** Copia un curso de Artiefy (con clases, actividades y parámetros). */
async function copiarCursoEnTx(
  tx: Tx,
  academyId: number,
  courseId: number,
  creatorId: string
) {
  const [curso] = await tx
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!curso) throw new ErrorAcademia('Curso no encontrado', 404);

  const [categoria, modalidad, niv, horario, espacio, certificacion] =
    await Promise.all([
      nombreDe(tx, categories, curso.categoryid),
      nombreDe(tx, modalidades, curso.modalidadesid),
      nombreDe(tx, nivel, curso.nivelid),
      nombreDe(tx, scheduleOptions, curso.scheduleOptionId),
      nombreDe(tx, spaceOptions, curso.spaceOptionId),
      nombreDe(tx, certificationTypes, curso.certificationTypeId),
    ]);

  // Catálogos obligatorios: si el curso no los tiene, "General".
  const categoriaId = await catalogo(
    tx,
    academyCategorias,
    academyId,
    categoria ?? 'General'
  );
  const modalidadId = await catalogo(
    tx,
    academyModalidades,
    academyId,
    modalidad ?? 'General'
  );
  const nivelId = await catalogo(
    tx,
    academyNiveles,
    academyId,
    niv ?? 'General'
  );

  // Instructores: los del curso que ya son educadores de la academia.
  const educadores = await educadoresDe(tx, curso.id, curso.instructor);
  const enAcademia = educadores.length
    ? await tx
        .select({ userId: academyUsers.userId })
        .from(academyUsers)
        .where(
          and(
            eq(academyUsers.academyId, academyId),
            inArray(
              academyUsers.userId,
              educadores.map((e) => e.id)
            )
          )
        )
    : [];
  const instructores = [
    ...(enAcademia.some((e) => e.userId === curso.instructor)
      ? [curso.instructor]
      : []),
    ...enAcademia.map((e) => e.userId).filter((id) => id !== curso.instructor),
  ];

  const [nuevo] = await tx
    .insert(academyCourses)
    .values({
      academyId,
      title: curso.title,
      subtitle: curso.subtitle,
      description: curso.description,
      coverImageKey: curso.coverImageKey,
      coverVideoCourseKey: curso.coverVideoCourseKey,
      categoriaId: categoriaId!,
      modalidadId: modalidadId!,
      nivelId: nivelId!,
      horarioId: await catalogo(tx, academyHorarios, academyId, horario),
      espacioId: await catalogo(tx, academyEspacios, academyId, espacio),
      tipoCertificacionId: await catalogo(
        tx,
        academyTiposCertificacion,
        academyId,
        certificacion
      ),
      instructor: instructores[0] ?? null,
      creatorId,
      individualPrice: curso.individualPrice,
      isActive: curso.isActive ?? true,
      visibility: curso.visibility ?? true,
    })
    .returning({ id: academyCourses.id });
  if (!nuevo) throw new Error('No se pudo crear el curso');

  if (instructores.length > 1) {
    await tx
      .insert(academyCourseInstructors)
      .values(
        instructores.slice(1).map((userId) => ({ courseId: nuevo.id, userId }))
      );
  }

  // Parámetros de evaluación.
  const params = await tx
    .select()
    .from(parametros)
    .where(eq(parametros.courseId, curso.id))
    .orderBy(asc(parametros.id));
  const mapaParametros = new Map<number, number>();
  for (const p of params) {
    const [np] = await tx
      .insert(academyParametros)
      .values({
        academyId,
        courseId: nuevo.id,
        name: p.name,
        description: p.description,
        porcentaje: p.porcentaje,
        numberOfActivities: p.numberOfActivities || 1,
      })
      .returning({ id: academyParametros.id });
    if (np) mapaParametros.set(p.id, np.id);
  }

  // Clases y sus actividades.
  const clases = await tx
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, curso.id))
    .orderBy(asc(lessons.orderIndex), asc(lessons.id));
  const acts = clases.length
    ? await tx
        .select()
        .from(activities)
        .where(
          inArray(
            activities.lessonsId,
            clases.map((c) => c.id)
          )
        )
        .orderBy(asc(activities.id))
    : [];
  for (const [i, c] of clases.entries()) {
    const [nl] = await tx
      .insert(academyLessons)
      .values({
        academyId,
        courseId: nuevo.id,
        title: c.title,
        description: c.description,
        orden: i + 1,
        duracionMin: c.duration,
        coverImageKey: c.coverImageKey || null,
        coverVideoKey: c.coverVideoKey || null,
        resourceKey: c.resourceKey || null,
        resourceNames: c.resourceNames || null,
      })
      .returning({ id: academyLessons.id });
    if (!nl) continue;
    const deClase = acts.filter((a) => a.lessonsId === c.id);
    if (deClase.length === 0) continue;
    await tx.insert(academyActivities).values(
      deClase.map((a) => {
        const parametroId = a.parametroId
          ? (mapaParametros.get(a.parametroId) ?? null)
          : null;
        return {
          academyId,
          lessonId: nl.id,
          title: a.name,
          description: a.description,
          tipo: 'tarea' as const,
          fechaInicio: a.fechaInicioActividad,
          fechaLimite: a.fechaMaximaEntrega,
          calificable: parametroId !== null,
          parametroId,
          porcentaje: parametroId !== null ? a.porcentaje : null,
        };
      })
    );
  }

  return { id: nuevo.id, title: curso.title, educadores };
}

/**
 * Envía (copia) un curso de Artiefy a la academia. Con `conEducadores`, sus
 * educadores de Artiefy se agregan a la academia (si no estaban) y quedan
 * como instructores de la copia.
 */
export async function enviarCurso(
  academia: Academia,
  courseId: number,
  creatorId: string,
  conEducadores: boolean
) {
  if (conEducadores) await traerEducadores(academia, [courseId]);
  const copia = await enTransaccion((tx) =>
    copiarCursoEnTx(tx, academia.id, courseId, creatorId)
  );
  await registrarLog(
    academia.id,
    'Curso recibido de Artiefy',
    `${copia.title} (#${copia.id})`
  );
  return { id: copia.id, title: copia.title };
}

/** Agrega a la academia, como educadores, a los de esos cursos de Artiefy. */
async function traerEducadores(academia: Academia, courseIds: number[]) {
  const educadores = await enTransaccion(async (tx) => {
    const lista: { id: string; name: string | null; email: string }[] = [];
    for (const id of courseIds) {
      const [c] = await tx
        .select({ instructor: courses.instructor })
        .from(courses)
        .where(eq(courses.id, id))
        .limit(1);
      if (c) lista.push(...(await educadoresDe(tx, id, c.instructor)));
    }
    return lista;
  });
  const unicos = [...new Map(educadores.map((e) => [e.id, e])).values()];
  const yaEstan = unicos.length
    ? await enTransaccion((tx) =>
        tx
          .select({ userId: academyUsers.userId })
          .from(academyUsers)
          .where(
            and(
              eq(academyUsers.academyId, academia.id),
              inArray(
                academyUsers.userId,
                unicos.map((e) => e.id)
              )
            )
          )
      )
    : [];
  const nuevos = unicos.filter(
    (e) => e.email && !yaEstan.some((y) => y.userId === e.id)
  );
  if (nuevos.length > 0) {
    await enviarUsuarios(
      academia,
      nuevos.map((e) => ({ email: e.email, nombre: e.name ?? e.email })),
      'educador'
    );
  }
}

// ------------------------------------------------------------ Programas ---

/**
 * Envía un programa de Artiefy: crea el programa en la academia y copia cada
 * curso de sus materias (una vez cada uno), ligándolos al programa.
 */
export async function enviarPrograma(
  academia: Academia,
  programaId: number,
  creatorId: string,
  conEducadores: boolean
) {
  const [programa] = await enTransaccion((tx) =>
    tx
      .select({
        id: programas.id,
        title: programas.title,
        description: programas.description,
      })
      .from(programas)
      .where(eq(programas.id, programaId))
      .limit(1)
  );
  if (!programa) throw new ErrorAcademia('Programa no encontrado', 404);
  const cursosIds = [
    ...new Set(
      (
        await enTransaccion((tx) =>
          tx
            .select({ courseId: materias.courseid })
            .from(materias)
            .where(
              and(
                eq(materias.programaId, programaId),
                isNotNull(materias.courseid)
              )
            )
        )
      )
        .map((m) => m.courseId)
        .filter((id): id is number => id !== null)
    ),
  ];

  if (conEducadores && cursosIds.length) {
    await traerEducadores(academia, cursosIds);
  }

  const resultado = await enTransaccion(async (tx) => {
    const [nuevo] = await tx
      .insert(academyProgramas)
      .values({
        academyId: academia.id,
        title: programa.title,
        description: programa.description,
      })
      .returning({ id: academyProgramas.id });
    if (!nuevo) throw new Error('No se pudo crear el programa');
    for (const courseId of cursosIds) {
      const copia = await copiarCursoEnTx(tx, academia.id, courseId, creatorId);
      await tx
        .insert(academyProgramaCursos)
        .values({ programaId: nuevo.id, courseId: copia.id });
    }
    return { id: nuevo.id, cursos: cursosIds.length };
  });

  await registrarLog(
    academia.id,
    'Programa recibido de Artiefy',
    `${programa.title} (${resultado.cursos} cursos)`
  );
  return { ...resultado, title: programa.title };
}

// ---------------------------------------------- Duplicar (en Artiefy) ---

/**
 * Duplica un curso de Artiefy dentro de Artiefy: el curso (como "… (copia)",
 * oculto hasta revisarlo), sus educadores, parámetros, clases y actividades.
 * No copia estudiantes, notas ni las preguntas de las actividades.
 */
export async function duplicarCursoArtiefy(courseId: number, userId: string) {
  return enTransaccion(async (tx) => {
    const [curso] = await tx
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!curso) throw new ErrorAcademia('Curso no encontrado', 404);

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      embedding: _e,
      ...datos
    } = curso;
    const [nuevo] = await tx
      .insert(courses)
      .values({
        ...datos,
        title: `${curso.title} (copia)`.slice(0, 255),
        creatorId: userId,
        is_top: false,
        is_featured: false,
        visibility: false,
      })
      .returning({ id: courses.id, title: courses.title });
    if (!nuevo) throw new Error('No se pudo duplicar el curso');

    const extra = await tx
      .select({ instructorId: courseInstructors.instructorId })
      .from(courseInstructors)
      .where(eq(courseInstructors.courseId, curso.id));
    if (extra.length) {
      await tx
        .insert(courseInstructors)
        .values(extra.map((e) => ({ courseId: nuevo.id, ...e })))
        .onConflictDoNothing();
    }

    const params = await tx
      .select()
      .from(parametros)
      .where(eq(parametros.courseId, curso.id));
    const mapa = new Map<number, number>();
    for (const { id, ...p } of params) {
      const [np] = await tx
        .insert(parametros)
        .values({ ...p, courseId: nuevo.id })
        .returning({ id: parametros.id });
      if (np) mapa.set(id, np.id);
    }

    const clases = await tx
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, curso.id));
    const acts = clases.length
      ? await tx
          .select()
          .from(activities)
          .where(
            inArray(
              activities.lessonsId,
              clases.map((c) => c.id)
            )
          )
      : [];
    for (const {
      id,
      createdAt: _lc,
      updatedAt: _lu,
      lastUpdated: _ll,
      ...c
    } of clases) {
      const [nl] = await tx
        .insert(lessons)
        .values({ ...c, courseId: nuevo.id })
        .returning({ id: lessons.id });
      if (!nl) continue;
      const deClase = acts.filter((a) => a.lessonsId === id);
      for (const { id: _aid, lastUpdated: _al, ...a } of deClase) {
        await tx.insert(activities).values({
          ...a,
          lessonsId: nl.id,
          parametroId: a.parametroId ? (mapa.get(a.parametroId) ?? null) : null,
        });
      }
    }
    return nuevo;
  });
}
