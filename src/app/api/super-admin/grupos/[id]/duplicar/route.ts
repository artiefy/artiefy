/**
 * POST /api/super-admin/grupos/[id]/duplicar
 *
 * Crea una nueva HOJA (sub-grupo) idéntica a la actual dentro de la misma
 * familia: copia el curso y las fechas/clases, pero SIN estudiantes ni
 * asistencia (el operador agrega los estudiantes después).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Pool } from '@neondatabase/serverless';
import { eq, inArray, isNull, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { env } from '~/env';
import { db } from '~/server/db';
import * as schema from '~/server/db/schema';
import {
  enrollmentProgramSources,
  grupoAsistencia,
  grupoCursos,
  grupoEstudiantes,
  grupoEstudiantesPendientes,
  grupoProgramas,
  grupos,
  grupoSesiones,
} from '~/server/db/schema';
import { establecerProgramasDeHoja } from '~/server/lib/grupos-programas-sync';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return {
    ok: Boolean(userId) && (role === 'super-admin' || role === 'admin'),
    userId,
  };
};

const duplicarGrupoRaiz = async (grupoId: number, userId: string) => {
  const pool = new Pool({ connectionString: env.POSTGRES_URL });
  const transactionalDb = drizzle({ client: pool, schema });

  try {
    return await transactionalDb.transaction(
      async (tx) => {
        const [original] = await tx
          .select()
          .from(grupos)
          .where(eq(grupos.id, grupoId))
          .for('update')
          .limit(1);
        if (!original || original.parentId != null) {
          throw new Error('Grupo raíz no encontrado');
        }

        const hojas = await tx
          .select()
          .from(grupos)
          .where(eq(grupos.parentId, grupoId));
        const raizNombre = original.nombre.replace(
          /\s*\(copia(?:\s+\d+)?\)\s*$/i,
          ''
        );
        const nombres = await tx
          .select({ nombre: grupos.nombre })
          .from(grupos)
          .where(isNull(grupos.parentId));
        const existentes = new Set(nombres.map((grupo) => grupo.nombre));
        let nombre = `${raizNombre} (copia)`;
        let numero = 2;
        while (existentes.has(nombre)) {
          nombre = `${raizNombre} (copia ${numero})`;
          numero += 1;
        }

        const [nuevaRaiz] = await tx
          .insert(grupos)
          .values({
            nombre,
            nombreHoja: original.nombreHoja,
            parentId: null,
            programa: original.programa,
            filtroColumna: original.filtroColumna,
            filtroValor: original.filtroValor,
            courseId: original.courseId,
            espacio: original.espacio,
            empresa: original.empresa,
            educador: original.educador,
            horario: original.horario,
            curso: original.curso,
            fechaInicio: original.fechaInicio,
            fechaFin: original.fechaFin,
            archivado: false,
            createdBy: userId,
          })
          .returning({ id: grupos.id });
        if (!nuevaRaiz) throw new Error('No se pudo crear el grupo');

        const grupoIds = new Map<number, number>([[original.id, nuevaRaiz.id]]);
        for (const hoja of hojas) {
          const [nuevaHoja] = await tx
            .insert(grupos)
            .values({
              nombre: hoja.nombre,
              nombreHoja: hoja.nombreHoja,
              parentId: nuevaRaiz.id,
              programa: hoja.programa,
              filtroColumna: hoja.filtroColumna,
              filtroValor: hoja.filtroValor,
              courseId: hoja.courseId,
              espacio: hoja.espacio,
              empresa: hoja.empresa,
              educador: hoja.educador,
              horario: hoja.horario,
              curso: hoja.curso,
              fechaInicio: hoja.fechaInicio,
              fechaFin: hoja.fechaFin,
              archivado: false,
              createdBy: userId,
            })
            .returning({ id: grupos.id });
          if (!nuevaHoja) throw new Error('No se pudo copiar una hoja');
          grupoIds.set(hoja.id, nuevaHoja.id);
        }

        const idsOriginales = [...grupoIds.keys()];
        const [miembros, pendientes, programas, cursos, origenes, sesiones] =
          await Promise.all([
            tx
              .select({
                grupoId: grupoEstudiantes.grupoId,
                userId: grupoEstudiantes.userId,
                modalidad: grupoEstudiantes.modalidad,
                observaciones: grupoEstudiantes.observaciones,
              })
              .from(grupoEstudiantes)
              .where(inArray(grupoEstudiantes.grupoId, idsOriginales)),
            tx
              .select({
                grupoId: grupoEstudiantesPendientes.grupoId,
                name: grupoEstudiantesPendientes.name,
                identificacionNumero:
                  grupoEstudiantesPendientes.identificacionNumero,
                phone: grupoEstudiantesPendientes.phone,
                modalidad: grupoEstudiantesPendientes.modalidad,
                observaciones: grupoEstudiantesPendientes.observaciones,
              })
              .from(grupoEstudiantesPendientes)
              .where(
                inArray(grupoEstudiantesPendientes.grupoId, idsOriginales)
              ),
            tx
              .select({
                grupoId: grupoProgramas.grupoId,
                programaId: grupoProgramas.programaId,
              })
              .from(grupoProgramas)
              .where(inArray(grupoProgramas.grupoId, idsOriginales)),
            tx
              .select({
                grupoId: grupoCursos.grupoId,
                courseId: grupoCursos.courseId,
              })
              .from(grupoCursos)
              .where(inArray(grupoCursos.grupoId, idsOriginales)),
            tx
              .select({
                grupoId: enrollmentProgramSources.grupoId,
                enrollmentProgramId:
                  enrollmentProgramSources.enrollmentProgramId,
              })
              .from(enrollmentProgramSources)
              .where(inArray(enrollmentProgramSources.grupoId, idsOriginales)),
            tx
              .select({
                id: grupoSesiones.id,
                grupoId: grupoSesiones.grupoId,
                courseId: grupoSesiones.courseId,
                fecha: grupoSesiones.fecha,
                titulo: grupoSesiones.titulo,
              })
              .from(grupoSesiones)
              .where(inArray(grupoSesiones.grupoId, idsOriginales)),
          ]);

        if (miembros.length > 0) {
          await tx.insert(grupoEstudiantes).values(
            miembros.map((miembro) => ({
              grupoId: grupoIds.get(miembro.grupoId)!,
              userId: miembro.userId,
              modalidad: miembro.modalidad,
              observaciones: miembro.observaciones,
            }))
          );
        }
        if (pendientes.length > 0) {
          await tx.insert(grupoEstudiantesPendientes).values(
            pendientes.map((pendiente) => ({
              grupoId: grupoIds.get(pendiente.grupoId)!,
              name: pendiente.name,
              identificacionNumero: pendiente.identificacionNumero,
              phone: pendiente.phone,
              modalidad: pendiente.modalidad,
              observaciones: pendiente.observaciones,
            }))
          );
        }
        if (programas.length > 0) {
          await tx.insert(grupoProgramas).values(
            programas.map((programa) => ({
              grupoId: grupoIds.get(programa.grupoId)!,
              programaId: programa.programaId,
            }))
          );
        }
        if (cursos.length > 0) {
          await tx.insert(grupoCursos).values(
            cursos.map((curso) => ({
              grupoId: grupoIds.get(curso.grupoId)!,
              courseId: curso.courseId,
            }))
          );
        }
        if (origenes.length > 0) {
          await tx.insert(enrollmentProgramSources).values(
            origenes.map((origen) => ({
              grupoId: grupoIds.get(origen.grupoId)!,
              enrollmentProgramId: origen.enrollmentProgramId,
            }))
          );
        }

        const sesionesIds = sesiones.map((sesion) => sesion.id);
        const asistencias =
          sesionesIds.length > 0
            ? await tx
                .select({
                  sesionId: grupoAsistencia.sesionId,
                  userId: grupoAsistencia.userId,
                  estado: grupoAsistencia.estado,
                })
                .from(grupoAsistencia)
                .where(inArray(grupoAsistencia.sesionId, sesionesIds))
            : [];
        const asistenciasPorSesion = new Map<number, typeof asistencias>();
        for (const asistencia of asistencias) {
          const actuales = asistenciasPorSesion.get(asistencia.sesionId) ?? [];
          actuales.push(asistencia);
          asistenciasPorSesion.set(asistencia.sesionId, actuales);
        }

        for (const sesion of sesiones) {
          const [nuevaSesion] = await tx
            .insert(grupoSesiones)
            .values({
              grupoId: grupoIds.get(sesion.grupoId)!,
              courseId: sesion.courseId,
              fecha: sesion.fecha,
              titulo: sesion.titulo,
            })
            .returning({ id: grupoSesiones.id });
          if (!nuevaSesion) throw new Error('No se pudo copiar una sesión');

          const marcas = asistenciasPorSesion.get(sesion.id) ?? [];
          if (marcas.length > 0) {
            await tx.insert(grupoAsistencia).values(
              marcas.map((marca) => ({
                sesionId: nuevaSesion.id,
                userId: marca.userId,
                estado: marca.estado,
              }))
            );
          }
        }

        return { id: nuevaRaiz.id, nombre };
      },
      { isolationLevel: 'serializable' }
    );
  } finally {
    await pool.end();
  }
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ok, userId } = await autorizar();
  if (!ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }

  try {
    const [base] = await db
      .select()
      .from(grupos)
      .where(eq(grupos.id, grupoId))
      .limit(1);
    if (!base) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    if (base.parentId == null) {
      const duplicado = await duplicarGrupoRaiz(grupoId, userId!);
      return NextResponse.json({ ok: true, ...duplicado });
    }

    const familyRoot = base.parentId ?? base.id;

    // Cuántas hojas hay ya en la familia (para numerar la nueva).
    const familia = await db
      .select({ id: grupos.id })
      .from(grupos)
      .where(or(eq(grupos.id, familyRoot), eq(grupos.parentId, familyRoot)));
    const numero = familia.length + 1;

    // Nombre base sin sufijo "(n)" previo.
    const nombreBase = base.nombre.replace(/\s*\(\d+\)\s*$/, '').trim();

    const [nueva] = await db
      .insert(grupos)
      .values({
        nombre: `${nombreBase} (${numero})`,
        parentId: familyRoot,
        programa: base.programa,
        filtroColumna: base.filtroColumna,
        filtroValor: base.filtroValor,
        courseId: base.courseId,
        empresa: base.empresa,
        fechaInicio: base.fechaInicio,
        fechaFin: base.fechaFin,
        createdBy: userId,
      })
      .returning({ id: grupos.id });

    if (!nueva) {
      return NextResponse.json(
        { error: 'No se pudo crear la hoja' },
        { status: 500 }
      );
    }

    // Copia TODOS los programas de la hoja (misma lógica que al editarlos).
    const programasBase = await db
      .select({ programaId: grupoProgramas.programaId })
      .from(grupoProgramas)
      .where(eq(grupoProgramas.grupoId, grupoId));
    if (programasBase.length > 0) {
      await establecerProgramasDeHoja(
        nueva.id,
        programasBase.map((p) => p.programaId)
      );
    }

    // Copia el curso (hoja) asignado.
    const cursos = await db
      .select({ courseId: grupoCursos.courseId })
      .from(grupoCursos)
      .where(eq(grupoCursos.grupoId, grupoId));
    if (cursos.length > 0) {
      await db
        .insert(grupoCursos)
        .values(
          cursos.map((c) => ({ grupoId: nueva.id, courseId: c.courseId }))
        )
        .onConflictDoNothing();
    }

    // Copia las fechas/clases (sin asistencia).
    const sesiones = await db
      .select({
        fecha: grupoSesiones.fecha,
        titulo: grupoSesiones.titulo,
        courseId: grupoSesiones.courseId,
      })
      .from(grupoSesiones)
      .where(eq(grupoSesiones.grupoId, grupoId));
    if (sesiones.length > 0) {
      await db.insert(grupoSesiones).values(
        sesiones.map((s) => ({
          grupoId: nueva.id,
          courseId: s.courseId,
          fecha: s.fecha,
          titulo: s.titulo,
        }))
      );
    }

    const pendientes = await db
      .select({
        name: grupoEstudiantesPendientes.name,
        identificacionNumero: grupoEstudiantesPendientes.identificacionNumero,
        phone: grupoEstudiantesPendientes.phone,
        modalidad: grupoEstudiantesPendientes.modalidad,
        observaciones: grupoEstudiantesPendientes.observaciones,
      })
      .from(grupoEstudiantesPendientes)
      .where(eq(grupoEstudiantesPendientes.grupoId, grupoId));
    if (pendientes.length > 0) {
      await db
        .insert(grupoEstudiantesPendientes)
        .values(
          pendientes.map((pendiente) => ({ grupoId: nueva.id, ...pendiente }))
        );
    }

    return NextResponse.json({ ok: true, id: nueva.id });
  } catch (error) {
    console.error('[GRUPOS] duplicar grupo:', error);
    return NextResponse.json(
      { error: 'No se pudo duplicar el grupo' },
      { status: 500 }
    );
  }
}
