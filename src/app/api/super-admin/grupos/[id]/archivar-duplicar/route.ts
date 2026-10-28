/**
 * POST /api/super-admin/grupos/[id]/archivar-duplicar
 *
 * "Archivar y duplicar" una hoja: crea una hoja nueva en la misma familia con
 * TODO lo de la original (estudiantes, pendientes, fechas con su asistencia,
 * curso, programas, encabezado) y marca la original como hoja archivada (solo
 * lectura, al final de las pestañas). Todo en una transacción.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Pool } from '@neondatabase/serverless';
import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { env } from '~/env';
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

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return {
    ok: Boolean(userId) && (role === 'super-admin' || role === 'admin'),
    userId,
  };
};

class ErrorHoja extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ok, userId } = await autorizar();
  if (!ok || !userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }

  const pool = new Pool({ connectionString: env.POSTGRES_URL });
  const tdb = drizzle({ client: pool, schema });

  try {
    const resultado = await tdb.transaction(
      async (tx) => {
        const [original] = await tx
          .select()
          .from(grupos)
          .where(eq(grupos.id, grupoId))
          .for('update')
          .limit(1);
        if (!original) throw new ErrorHoja('Hoja no encontrada', 404);
        if (original.hojaArchivada) {
          throw new ErrorHoja('La hoja ya está archivada', 409);
        }

        // La nueva hoja siempre es hija de la raíz; se llama como la pestaña
        // original (en la raíz, su nombreHoja si lo tiene).
        const familyRoot = original.parentId ?? original.id;
        const nombre =
          original.parentId == null
            ? (original.nombreHoja ?? original.nombre)
            : original.nombre;

        const [nueva] = await tx
          .insert(grupos)
          .values({
            nombre,
            parentId: familyRoot,
            programa: original.programa,
            filtroColumna: original.filtroColumna,
            filtroValor: original.filtroValor,
            courseId: original.courseId,
            teamsJoinUrl: original.teamsJoinUrl,
            teamsMeetingId: original.teamsMeetingId,
            espacio: original.espacio,
            empresa: original.empresa,
            educador: original.educador,
            horario: original.horario,
            curso: original.curso,
            fechaInicio: original.fechaInicio,
            fechaFin: original.fechaFin,
            createdBy: userId,
          })
          .returning({ id: grupos.id });
        if (!nueva) throw new Error('No se pudo crear la hoja');

        const [miembros, pendientes, programas, cursos, origenes, sesiones] =
          await Promise.all([
            tx
              .select({
                userId: grupoEstudiantes.userId,
                modalidad: grupoEstudiantes.modalidad,
                observaciones: grupoEstudiantes.observaciones,
              })
              .from(grupoEstudiantes)
              .where(eq(grupoEstudiantes.grupoId, grupoId)),
            tx
              .select({
                name: grupoEstudiantesPendientes.name,
                identificacionNumero:
                  grupoEstudiantesPendientes.identificacionNumero,
                phone: grupoEstudiantesPendientes.phone,
                modalidad: grupoEstudiantesPendientes.modalidad,
                observaciones: grupoEstudiantesPendientes.observaciones,
              })
              .from(grupoEstudiantesPendientes)
              .where(eq(grupoEstudiantesPendientes.grupoId, grupoId)),
            tx
              .select({ programaId: grupoProgramas.programaId })
              .from(grupoProgramas)
              .where(eq(grupoProgramas.grupoId, grupoId)),
            tx
              .select({ courseId: grupoCursos.courseId })
              .from(grupoCursos)
              .where(eq(grupoCursos.grupoId, grupoId)),
            tx
              .select({
                enrollmentProgramId:
                  enrollmentProgramSources.enrollmentProgramId,
              })
              .from(enrollmentProgramSources)
              .where(eq(enrollmentProgramSources.grupoId, grupoId)),
            tx
              .select({
                id: grupoSesiones.id,
                courseId: grupoSesiones.courseId,
                fecha: grupoSesiones.fecha,
                titulo: grupoSesiones.titulo,
              })
              .from(grupoSesiones)
              .where(eq(grupoSesiones.grupoId, grupoId)),
          ]);

        if (miembros.length > 0) {
          await tx
            .insert(grupoEstudiantes)
            .values(miembros.map((m) => ({ grupoId: nueva.id, ...m })));
        }
        if (pendientes.length > 0) {
          await tx
            .insert(grupoEstudiantesPendientes)
            .values(pendientes.map((p) => ({ grupoId: nueva.id, ...p })));
        }
        if (programas.length > 0) {
          await tx
            .insert(grupoProgramas)
            .values(programas.map((p) => ({ grupoId: nueva.id, ...p })))
            .onConflictDoNothing();
        }
        if (cursos.length > 0) {
          await tx
            .insert(grupoCursos)
            .values(cursos.map((c) => ({ grupoId: nueva.id, ...c })))
            .onConflictDoNothing();
        }
        if (origenes.length > 0) {
          await tx
            .insert(enrollmentProgramSources)
            .values(origenes.map((o) => ({ grupoId: nueva.id, ...o })))
            .onConflictDoNothing();
        }

        // Fechas con su asistencia.
        const sesionesIds = sesiones.map((s) => s.id);
        const marcas =
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
        for (const s of sesiones) {
          const [nuevaSesion] = await tx
            .insert(grupoSesiones)
            .values({
              grupoId: nueva.id,
              courseId: s.courseId,
              fecha: s.fecha,
              titulo: s.titulo,
            })
            .returning({ id: grupoSesiones.id });
          if (!nuevaSesion) throw new Error('No se pudo copiar una fecha');
          const deSesion = marcas.filter((m) => m.sesionId === s.id);
          if (deSesion.length > 0) {
            await tx.insert(grupoAsistencia).values(
              deSesion.map((m) => ({
                sesionId: nuevaSesion.id,
                userId: m.userId,
                estado: m.estado,
              }))
            );
          }
        }

        await tx
          .update(grupos)
          .set({ hojaArchivada: true, updatedAt: new Date() })
          .where(eq(grupos.id, grupoId));

        return { id: nueva.id, nombre };
      },
      { isolationLevel: 'serializable' }
    );
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    if (error instanceof ErrorHoja) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error('[GRUPOS] archivar y duplicar hoja:', error);
    return NextResponse.json(
      { error: 'No se pudo archivar y duplicar la hoja' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
