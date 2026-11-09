import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyColumnas,
  academyComentarios,
  academyCourses,
  academyEnrollments,
  academyEstudianteDatos,
  academyGrupoEstudiantes,
  academyGrupos,
  academyProgramaCursos,
  academyProgramas,
  academyUsers,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Estudiantes de una academia (academy_users con rol estudiante) con los
// cursos de la academia en los que están matriculados (academy_enrollments).

export interface EstudianteAcademia {
  id: number;
  userId: string;
  name: string | null;
  email: string;
  activo: boolean;
  fecha: string;
  cursos: {
    id: number;
    title: string;
    completed: boolean;
    enrolledAt: string;
  }[];
  // Datos editables (teléfono, documento, estado, cartera…, columnas propias).
  datos: Record<string, string>;
  grupos: string[];
  programas: string[];
}

/**
 * Lee sin romper la pantalla si la tabla aún no existe (SQL pendiente:
 * scripts/academy_gestion_estudiantes.sql).
 */
const opcional = <T>(promesa: Promise<T[]>): Promise<T[]> =>
  promesa.catch(() => []);

export async function listarEstudiantes(
  academyId: number
): Promise<EstudianteAcademia[]> {
  const [estudiantes, matriculas] = await Promise.all([
    withRetry(() =>
      db
        .select()
        .from(academyUsers)
        .where(
          and(
            eq(academyUsers.academyId, academyId),
            eq(academyUsers.role, 'estudiante')
          )
        )
        .orderBy(asc(academyUsers.name))
    ),
    withRetry(() =>
      db
        .select({
          userId: academyEnrollments.userId,
          id: academyCourses.id,
          title: academyCourses.title,
          completed: academyEnrollments.completed,
          enrolledAt: academyEnrollments.enrolledAt,
        })
        .from(academyEnrollments)
        .innerJoin(
          academyCourses,
          eq(academyCourses.id, academyEnrollments.courseId)
        )
        .where(eq(academyEnrollments.academyId, academyId))
        .orderBy(asc(academyCourses.title))
    ),
  ]);

  const [datos, grupos, programas] = await Promise.all([
    opcional(
      db
        .select({
          userId: academyEstudianteDatos.userId,
          datos: academyEstudianteDatos.datos,
        })
        .from(academyEstudianteDatos)
        .where(eq(academyEstudianteDatos.academyId, academyId))
    ),
    opcional(
      db
        .select({
          userId: academyGrupoEstudiantes.userId,
          nombre: academyGrupos.nombre,
        })
        .from(academyGrupoEstudiantes)
        .innerJoin(
          academyGrupos,
          eq(academyGrupos.id, academyGrupoEstudiantes.grupoId)
        )
        .where(eq(academyGrupos.academyId, academyId))
    ),
    opcional(
      db
        .select({
          courseId: academyProgramaCursos.courseId,
          title: academyProgramas.title,
        })
        .from(academyProgramaCursos)
        .innerJoin(
          academyProgramas,
          eq(academyProgramas.id, academyProgramaCursos.programaId)
        )
        .where(eq(academyProgramas.academyId, academyId))
    ),
  ]);

  const cursosPorUsuario = new Map<string, EstudianteAcademia['cursos']>();
  for (const { userId, enrolledAt, ...curso } of matriculas) {
    cursosPorUsuario.set(userId, [
      ...(cursosPorUsuario.get(userId) ?? []),
      { ...curso, enrolledAt: enrolledAt.toISOString() },
    ]);
  }

  return estudiantes.map((e) => ({
    id: e.id,
    userId: e.userId,
    name: e.name,
    email: e.email,
    activo: e.activo,
    fecha: e.createdAt.toISOString(),
    cursos: cursosPorUsuario.get(e.userId) ?? [],
    datos: datos.find((d) => d.userId === e.userId)?.datos ?? {},
    grupos: grupos.filter((g) => g.userId === e.userId).map((g) => g.nombre),
    programas: [
      ...new Set(
        (cursosPorUsuario.get(e.userId) ?? []).flatMap((c) =>
          programas.filter((p) => p.courseId === c.id).map((p) => p.title)
        )
      ),
    ],
  }));
}

// ------------------------------------------------- Datos editables ---

const CLAVE_RE = /^[a-z0-9_]{1,40}$/;

/** Cuentas (de la academia) entre esos ids; por defecto solo estudiantes. */
async function estudiantesValidos(
  academyId: number,
  userIds: string[],
  soloEstudiantes = true
) {
  if (userIds.length === 0) return [];
  const filas = await db
    .select({ userId: academyUsers.userId })
    .from(academyUsers)
    .where(
      and(
        eq(academyUsers.academyId, academyId),
        soloEstudiantes ? eq(academyUsers.role, 'estudiante') : undefined,
        inArray(academyUsers.userId, userIds)
      )
    );
  return filas.map((f) => f.userId);
}

/**
 * Guarda un campo (celda o "Editar Masivamente") de uno o varios
 * estudiantes. Valor vacío borra el campo.
 */
export async function guardarDato(
  academyId: number,
  userIds: string[],
  campo: string,
  valor: string,
  // false: cualquier cuenta de la academia (Usuarios y Roles).
  soloEstudiantes = true
) {
  if (!CLAVE_RE.test(campo)) throw new ErrorAcademia('Campo inválido.');
  const ids = await estudiantesValidos(academyId, userIds, soloEstudiantes);
  if (ids.length === 0) throw new ErrorAcademia('Selecciona estudiantes.');
  const limpio = valor.trim().slice(0, 500);
  const parche = sql`jsonb_build_object(${campo}::text, ${limpio}::text)`;
  for (const userId of ids) {
    await db
      .insert(academyEstudianteDatos)
      .values({
        academyId,
        userId,
        datos: limpio ? { [campo]: limpio } : {},
      })
      .onConflictDoUpdate({
        target: [
          academyEstudianteDatos.academyId,
          academyEstudianteDatos.userId,
        ],
        set: {
          datos: limpio
            ? sql`${academyEstudianteDatos.datos} || ${parche}`
            : sql`${academyEstudianteDatos.datos} - ${campo}::text`,
          updatedAt: new Date(),
        },
      });
  }
  return ids.length;
}

// ------------------------------------------------ Columnas propias ---

export async function listarColumnas(academyId: number) {
  return opcional(
    withRetry(() =>
      db
        .select({
          clave: academyColumnas.clave,
          etiqueta: academyColumnas.etiqueta,
          opciones: academyColumnas.opciones,
        })
        .from(academyColumnas)
        .where(eq(academyColumnas.academyId, academyId))
        .orderBy(asc(academyColumnas.createdAt))
    )
  );
}

export async function crearColumna(
  academyId: number,
  etiqueta: string,
  opciones: string[]
) {
  const nombre = etiqueta.trim().slice(0, 60);
  if (!nombre)
    throw new ErrorAcademia('El nombre de la columna es obligatorio.');
  const base =
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30) || 'columna';
  const clave = `c_${base}`;
  const [nueva] = await db
    .insert(academyColumnas)
    .values({
      academyId,
      clave,
      etiqueta: nombre,
      opciones: opciones
        .map((o) => o.trim())
        .filter(Boolean)
        .slice(0, 50),
    })
    .onConflictDoNothing()
    .returning({ clave: academyColumnas.clave });
  if (!nueva) throw new ErrorAcademia('Ya existe una columna con ese nombre.');
  return nueva;
}

export async function eliminarColumna(academyId: number, clave: string) {
  await db
    .delete(academyColumnas)
    .where(
      and(
        eq(academyColumnas.academyId, academyId),
        eq(academyColumnas.clave, clave)
      )
    );
}

// ---------------------------------------------------- Comentarios ---

export async function listarComentarios(academyId: number, userId: string) {
  return withRetry(() =>
    db
      .select({
        id: academyComentarios.id,
        autor: academyComentarios.autor,
        texto: academyComentarios.texto,
        createdAt: academyComentarios.createdAt,
      })
      .from(academyComentarios)
      .where(
        and(
          eq(academyComentarios.academyId, academyId),
          eq(academyComentarios.userId, userId)
        )
      )
      .orderBy(desc(academyComentarios.createdAt))
  );
}

export async function agregarComentario(
  academyId: number,
  userId: string,
  autor: { id: string; nombre: string },
  texto: string
) {
  const limpio = texto.trim().slice(0, 2000);
  if (!limpio) throw new ErrorAcademia('Escribe el comentario.');
  const [valido] = await estudiantesValidos(academyId, [userId]);
  if (!valido) throw new ErrorAcademia('El estudiante no es de esta academia.');
  await db.insert(academyComentarios).values({
    academyId,
    userId,
    autorId: autor.id,
    autor: autor.nombre,
    texto: limpio,
  });
}

/**
 * Matricula estudiantes de la academia en uno de sus cursos (como
 * "Matricular a Curso" de Artiefy). Ignora a quien ya esté matriculado.
 */
export async function matricularEstudiantes(
  academyId: number,
  courseId: number,
  userIds: string[]
): Promise<number> {
  const [curso] = await db
    .select({ id: academyCourses.id })
    .from(academyCourses)
    .where(
      and(
        eq(academyCourses.id, courseId),
        eq(academyCourses.academyId, academyId)
      )
    )
    .limit(1);
  if (!curso) throw new ErrorAcademia('El curso no es de esta academia.');
  const validos =
    userIds.length > 0
      ? await db
          .select({ userId: academyUsers.userId })
          .from(academyUsers)
          .where(
            and(
              eq(academyUsers.academyId, academyId),
              eq(academyUsers.role, 'estudiante'),
              inArray(academyUsers.userId, userIds)
            )
          )
      : [];
  if (validos.length === 0) {
    throw new ErrorAcademia('Selecciona estudiantes de la academia.');
  }
  const nuevas = await db
    .insert(academyEnrollments)
    .values(validos.map(({ userId }) => ({ academyId, courseId, userId })))
    .onConflictDoNothing()
    .returning({ id: academyEnrollments.id });
  return nuevas.length;
}
