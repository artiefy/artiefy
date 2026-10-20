import { and, eq, inArray, notExists, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  enrollmentPrograms,
  enrollmentProgramSources,
  grupoEstudiantes,
  grupoProgramas,
  grupos,
  programas,
  users,
} from '~/server/db/schema';

import 'server-only';

/**
 * Sincroniza las matrículas estudiante-programa (`enrollment_programs`) con los
 * programas de las hojas (`grupo_programas`).
 *
 * - Una sola matrícula por (userId, programaId); cada hoja que la justifica
 *   deja un origen en `enrollment_program_sources`.
 * - `creada_por_grupo = true` solo si la sincronización creó la fila. Las que ya
 *   existían (manuales/legadas) conservan `false` y jamás se borran aquí.
 * - Se borra una matrícula solo si `creada_por_grupo = true` y ya no tiene
 *   ningún origen.
 * - `users.programa` es legado y no interviene.
 */

const CHUNK = 500;

const chunks = <T>(items: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) {
    out.push(items.slice(i, i + CHUNK));
  }
  return out;
};

const unicos = <T>(items: T[]): T[] => [...new Set(items)];

/** Asegura matrícula + origen de `grupoId` para cada usuario en cada programa. */
const asegurarOrigenes = async (
  grupoId: number,
  userIds: string[],
  programaIds: number[]
) => {
  for (const programaId of programaIds) {
    for (const lote of chunks(userIds)) {
      await db
        .insert(enrollmentPrograms)
        .values(
          lote.map((userId) => ({
            userId,
            programaId,
            enrolledAt: new Date(),
            completed: false,
            creadaPorGrupo: true,
          }))
        )
        .onConflictDoNothing({
          target: [enrollmentPrograms.userId, enrollmentPrograms.programaId],
        });

      const filas = await db
        .select({ id: enrollmentPrograms.id })
        .from(enrollmentPrograms)
        .where(
          and(
            eq(enrollmentPrograms.programaId, programaId),
            inArray(enrollmentPrograms.userId, lote)
          )
        );
      if (filas.length === 0) continue;
      await db
        .insert(enrollmentProgramSources)
        .values(filas.map((f) => ({ enrollmentProgramId: f.id, grupoId })))
        .onConflictDoNothing();
    }
  }
};

/** Quita los orígenes de `grupoId` y borra solo lo que quedó sin respaldo. */
const quitarOrigenes = async (
  grupoIds: number[],
  userIds: string[] | null,
  programaIds: number[] | null
) => {
  if (grupoIds.length === 0) return;
  if (userIds?.length === 0 || programaIds?.length === 0) return;

  // Matrículas afectadas (para limpiar solo esas).
  const afectadas = await db
    .select({ id: enrollmentProgramSources.enrollmentProgramId })
    .from(enrollmentProgramSources)
    .innerJoin(
      enrollmentPrograms,
      eq(enrollmentPrograms.id, enrollmentProgramSources.enrollmentProgramId)
    )
    .where(
      and(
        inArray(enrollmentProgramSources.grupoId, grupoIds),
        userIds ? inArray(enrollmentPrograms.userId, userIds) : undefined,
        programaIds
          ? inArray(enrollmentPrograms.programaId, programaIds)
          : undefined
      )
    );
  const ids = unicos(afectadas.map((a) => a.id));

  for (const lote of chunks(ids)) {
    await db
      .delete(enrollmentProgramSources)
      .where(
        and(
          inArray(enrollmentProgramSources.grupoId, grupoIds),
          inArray(enrollmentProgramSources.enrollmentProgramId, lote)
        )
      );
    await db.delete(enrollmentPrograms).where(
      and(
        inArray(enrollmentPrograms.id, lote),
        eq(enrollmentPrograms.creadaPorGrupo, true),
        notExists(
          db
            .select({ one: sql`1` })
            .from(enrollmentProgramSources)
            .where(
              eq(
                enrollmentProgramSources.enrollmentProgramId,
                enrollmentPrograms.id
              )
            )
        )
      )
    );
  }
};

const programasDeHoja = async (grupoId: number): Promise<number[]> => {
  const rows = await db
    .select({ programaId: grupoProgramas.programaId })
    .from(grupoProgramas)
    .where(eq(grupoProgramas.grupoId, grupoId));
  return rows.map((r) => r.programaId);
};

const miembrosDeHoja = async (grupoId: number): Promise<string[]> => {
  const rows = await db
    .select({ userId: grupoEstudiantes.userId })
    .from(grupoEstudiantes)
    .where(eq(grupoEstudiantes.grupoId, grupoId));
  return rows.map((r) => r.userId);
};

/** Programas agregados a una hoja: matricula a todos sus miembros. */
export const sincronizarProgramasAgregados = async (
  grupoId: number,
  programaIds: number[]
) => {
  const programas = unicos(programaIds);
  if (programas.length === 0) return;
  await asegurarOrigenes(grupoId, await miembrosDeHoja(grupoId), programas);
};

/** Programas quitados de una hoja: solo cae lo que ninguna otra hoja respalda. */
export const sincronizarProgramasQuitados = async (
  grupoId: number,
  programaIds: number[]
) => {
  await quitarOrigenes([grupoId], null, unicos(programaIds));
};

/** Estudiantes agregados a una hoja: los matricula en todos sus programas. */
export const sincronizarEstudiantesAgregados = async (
  grupoId: number,
  userIds: string[]
) => {
  const usuarios = unicos(userIds);
  if (usuarios.length === 0) return;
  await asegurarOrigenes(grupoId, usuarios, await programasDeHoja(grupoId));
};

/** Estudiantes retirados de una hoja: quita sus orígenes en esa hoja. */
export const sincronizarEstudiantesRetirados = async (
  grupoId: number,
  userIds: string[]
) => {
  await quitarOrigenes([grupoId], unicos(userIds), null);
};

/**
 * Hojas a eliminar: llamar ANTES de borrar `grupos` (el cascade eliminaría los
 * orígenes sin dejar limpiar las matrículas que quedarían sin respaldo).
 */
export const sincronizarHojasEliminadas = async (grupoIds: number[]) => {
  await quitarOrigenes(unicos(grupoIds), null, null);
};

/**
 * Un flujo manual reafirma estas matrículas: si la sincronización las había
 * creado, pasan a manuales (`creada_por_grupo = false`) y quedan protegidas.
 * Nunca vuelve a `true`.
 */
export const marcarMatriculasManuales = async (
  userIds: string[],
  programaId: number
) => {
  for (const lote of chunks(unicos(userIds))) {
    await db
      .update(enrollmentPrograms)
      .set({ creadaPorGrupo: false })
      .where(
        and(
          eq(enrollmentPrograms.programaId, programaId),
          inArray(enrollmentPrograms.userId, lote),
          eq(enrollmentPrograms.creadaPorGrupo, true)
        )
      );
  }
};

export type ResultadoEstablecerProgramas =
  | { ok: true; matriculados: number }
  | { ok: false; error: 'grupo' | 'programa' };

/**
 * Único punto de escritura de los programas de una hoja: reemplaza
 * `grupo_programas`, sincroniza solo la diferencia en las matrículas y deja el
 * primero como programa principal legado (`grupos.programa` / `users.programa`).
 */
export const establecerProgramasDeHoja = async (
  grupoId: number,
  programaIdsEntrada: number[]
): Promise<ResultadoEstablecerProgramas> => {
  const programaIds = unicos(programaIdsEntrada);

  const [grupo] = await db
    .select({ id: grupos.id, programa: grupos.programa })
    .from(grupos)
    .where(eq(grupos.id, grupoId))
    .limit(1);
  if (!grupo) return { ok: false, error: 'grupo' };

  const validos =
    programaIds.length > 0
      ? await db
          .select({ id: programas.id, title: programas.title })
          .from(programas)
          .where(inArray(programas.id, programaIds))
      : [];
  if (validos.length !== programaIds.length) {
    return { ok: false, error: 'programa' };
  }
  // Conserva el orden elegido; el primero es el principal.
  const titulos = new Map(validos.map((p) => [p.id, p.title]));
  const principal = programaIds.length ? titulos.get(programaIds[0]!)! : null;

  const actuales = await programasDeHoja(grupoId);
  const agregados = programaIds.filter((i) => !actuales.includes(i));
  const quitados = actuales.filter((i) => !programaIds.includes(i));

  if (quitados.length > 0) {
    await db
      .delete(grupoProgramas)
      .where(
        and(
          eq(grupoProgramas.grupoId, grupoId),
          inArray(grupoProgramas.programaId, quitados)
        )
      );
  }
  if (agregados.length > 0) {
    await db
      .insert(grupoProgramas)
      .values(agregados.map((programaId) => ({ grupoId, programaId })))
      .onConflictDoNothing();
  }
  await db
    .update(grupos)
    .set({ programa: principal, updatedAt: new Date() })
    .where(eq(grupos.id, grupoId));

  await sincronizarProgramasAgregados(grupoId, agregados);
  await sincronizarProgramasQuitados(grupoId, quitados);

  let matriculados = 0;
  if (principal && principal !== grupo.programa) {
    const ids = await miembrosDeHoja(grupoId);
    for (const lote of chunks(ids)) {
      await db
        .update(users)
        .set({ programa: principal, updatedAt: new Date() })
        .where(inArray(users.id, lote));
    }
    matriculados = ids.length;
  }
  return { ok: true, matriculados };
};
