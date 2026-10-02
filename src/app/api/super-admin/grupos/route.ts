/**
 * /api/super-admin/grupos
 *
 * GET  — lista los grupos con su conteo de miembros y el curso asignado.
 * POST — crea un grupo con el filtro usado y los estudiantes seleccionados.
 *        Con `parentId` crea una HOJA dentro de ese grupo, numerada
 *        automáticamente ("Grupo (3)").
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { desc, eq, isNull, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  grupoCursos,
  grupoEstudiantes,
  grupos,
  grupoSesiones,
} from '~/server/db/schema';
import { matricularEnCurso } from '~/server/lib/grupos-matricula';

// Genera fechas semanales (mismo día de la semana que 'inicio') hasta 'fin'.
function fechasSemanales(inicio: string, fin: string): string[] {
  const start = new Date(`${inicio}T00:00:00`);
  const end = new Date(`${fin}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];
  const salida: string[] = [];
  const d = new Date(start);
  // Tope de seguridad: máx 2 años de clases semanales.
  for (let i = 0; i < 106 && d <= end; i++) {
    salida.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 7);
  }
  return salida;
}

export async function GET() {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const [filas, conteoMiembros, conteoCursos] = await Promise.all([
      db
        .select({
          id: grupos.id,
          nombre: grupos.nombre,
          programa: grupos.programa,
          filtroColumna: grupos.filtroColumna,
          filtroValor: grupos.filtroValor,
          fechaInicio: grupos.fechaInicio,
          fechaFin: grupos.fechaFin,
          archivado: grupos.archivado,
          createdAt: grupos.createdAt,
        })
        .from(grupos)
        .where(isNull(grupos.parentId))
        .orderBy(desc(grupos.createdAt)),
      db
        .select({
          grupoId: grupoEstudiantes.grupoId,
          total: sql<number>`count(*)`,
        })
        .from(grupoEstudiantes)
        .groupBy(grupoEstudiantes.grupoId),
      db
        .select({
          grupoId: grupoCursos.grupoId,
          total: sql<number>`count(*)`,
        })
        .from(grupoCursos)
        .groupBy(grupoCursos.grupoId),
    ]);

    const miembrosPorGrupo = new Map(
      conteoMiembros.map((c) => [c.grupoId, Number(c.total ?? 0)])
    );
    const cursosPorGrupo = new Map(
      conteoCursos.map((c) => [c.grupoId, Number(c.total ?? 0)])
    );

    return NextResponse.json({
      grupos: filas.map((g) => ({
        ...g,
        miembros: miembrosPorGrupo.get(g.id) ?? 0,
        cursos: cursosPorGrupo.get(g.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error('[GRUPOS] list:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los grupos' },
      { status: 500 }
    );
  }
}

interface CuerpoCrear {
  nombre?: string | null;
  parentId?: number | null;
  programa?: string | null;
  columna?: string | null;
  valor?: string | null;
  cursoId?: number | null;
  userIds?: string[];
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CuerpoCrear | null;
  const parentIdBody = Number(body?.parentId);
  const esHoja = body?.parentId != null && Number.isFinite(parentIdBody);
  let nombre = body?.nombre?.trim() ?? '';
  let parentId: number | null = null;

  if (esHoja) {
    // Hoja nueva: va en la familia del grupo y toma su nombre numerado.
    const [padre] = await db
      .select({
        id: grupos.id,
        nombre: grupos.nombre,
        parentId: grupos.parentId,
      })
      .from(grupos)
      .where(eq(grupos.id, parentIdBody))
      .limit(1);
    if (!padre) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }
    parentId = padre.parentId ?? padre.id;
    const familia = await db
      .select({ id: grupos.id, nombre: grupos.nombre })
      .from(grupos)
      .where(or(eq(grupos.id, parentId), eq(grupos.parentId, parentId)));
    const raiz = familia.find((f) => f.id === parentId)?.nombre ?? padre.nombre;
    const nombreBase = raiz.replace(/\s*\(\d+\)\s*$/, '').trim();
    nombre = `${nombreBase} (${familia.length + 1})`;
  } else if (!nombre) {
    return NextResponse.json(
      { error: 'El nombre del grupo es obligatorio' },
      { status: 400 }
    );
  }

  const cursoId =
    body?.cursoId != null && Number.isFinite(Number(body.cursoId))
      ? Number(body.cursoId)
      : null;

  const userIds = Array.isArray(body?.userIds)
    ? [...new Set(body!.userIds.filter((u) => typeof u === 'string' && u))]
    : [];

  const fechaInicio = body?.fechaInicio?.trim() || null;
  const fechaFin = body?.fechaFin?.trim() || null;

  try {
    const [grupo] = await db
      .insert(grupos)
      .values({
        nombre,
        parentId,
        programa: body?.programa ?? null,
        filtroColumna: body?.columna ?? null,
        filtroValor: body?.valor ?? null,
        courseId: cursoId,
        fechaInicio,
        fechaFin,
        createdBy: userId,
      })
      .returning({ id: grupos.id });

    if (grupo && userIds.length > 0) {
      await db
        .insert(grupoEstudiantes)
        .values(userIds.map((uid) => ({ grupoId: grupo.id, userId: uid })))
        .onConflictDoNothing();
    }

    // El curso elegido queda como curso de la hoja (planilla) y sus
    // estudiantes quedan matriculados en él.
    if (grupo && cursoId != null) {
      await db
        .insert(grupoCursos)
        .values({ grupoId: grupo.id, courseId: cursoId })
        .onConflictDoNothing();
      await matricularEnCurso(cursoId, userIds);
    }

    // Genera las clases semanales entre fecha inicio y fin (mismo día).
    if (grupo && fechaInicio && fechaFin) {
      const fechas = fechasSemanales(fechaInicio, fechaFin);
      if (fechas.length > 0) {
        await db.insert(grupoSesiones).values(
          fechas.map((f) => ({
            grupoId: grupo.id,
            courseId: null,
            fecha: f,
            titulo: null,
          }))
        );
      }
    }

    return NextResponse.json({ ok: true, id: grupo?.id });
  } catch (error) {
    console.error('[GRUPOS] create:', error);
    return NextResponse.json(
      {
        error: esHoja
          ? 'No se pudo crear la hoja'
          : 'No se pudo crear el grupo',
      },
      { status: 500 }
    );
  }
}
