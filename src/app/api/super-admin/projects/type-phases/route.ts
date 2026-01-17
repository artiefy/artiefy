import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db/index';
import {
  projectPhases,
  projectTypePhases,
  projectTypes,
} from '~/server/db/schema';

// ✅ Validaciones con Zod
const getProjectTypePhasesSchema = z.object({
  projectTypeId: z.coerce.number().int().positive(),
});

const postProjectTypePhasesSchema = z.object({
  projectTypeId: z.number().int().positive(),
  phases: z
    .array(
      z.object({
        phaseId: z.number().int().positive(),
        order: z.number().int().positive(),
        isRequired: z.boolean().optional().default(true),
      })
    )
    .min(0),
});

// ✅ Middleware: Verificar SUPER_ADMIN
async function checkSuperAdmin() {
  const session = await auth();
  const userRole = session?.sessionClaims?.metadata?.role;

  if (!session || userRole !== 'super-admin') {
    return { error: 'No autorizado', status: 403 };
  }
  return { error: null };
}

// ✅ GET: Obtener fases asignadas a un tipo de proyecto (ordenadas)
export async function GET(req: Request) {
  try {
    const authCheck = await checkSuperAdmin();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectTypeId = searchParams.get('projectTypeId');

    if (!projectTypeId) {
      return NextResponse.json(
        { error: 'projectTypeId es requerido' },
        { status: 400 }
      );
    }

    const validated = getProjectTypePhasesSchema.parse({ projectTypeId });

    // Verificar que el tipo existe
    const typeExists = await db
      .select()
      .from(projectTypes)
      .where(eq(projectTypes.id, validated.projectTypeId));

    if (typeExists.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Obtener las fases asignadas, ordenadas por order
    const result = await db
      .select({
        id: projectTypePhases.id,
        projectTypeId: projectTypePhases.projectTypeId,
        phaseId: projectTypePhases.phaseId,
        phaseName: projectPhases.name,
        phaseDescription: projectPhases.description,
        order: projectTypePhases.order,
        isRequired: projectTypePhases.isRequired,
      })
      .from(projectTypePhases)
      .innerJoin(projectPhases, eq(projectTypePhases.phaseId, projectPhases.id))
      .where(eq(projectTypePhases.projectTypeId, validated.projectTypeId))
      .orderBy(projectTypePhases.order);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.issues },
        { status: 400 }
      );
    }
    console.error('❌ Error al obtener fases de tipo:', error);
    return NextResponse.json(
      { error: 'Error al obtener fases' },
      { status: 500 }
    );
  }
}

// ✅ POST: Asignar/actualizar fases a un tipo (bulk upsert con transacción)
export async function POST(req: Request) {
  try {
    const authCheck = await checkSuperAdmin();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = (await req.json()) as unknown;
    const validated = postProjectTypePhasesSchema.parse(body);

    // Verificar que el tipo existe
    const typeExists = await db
      .select()
      .from(projectTypes)
      .where(eq(projectTypes.id, validated.projectTypeId));

    if (typeExists.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que todas las fases existen
    if (validated.phases.length > 0) {
      const phaseIds = validated.phases.map((p) => p.phaseId);
      const existingPhases = await db
        .select({ id: projectPhases.id })
        .from(projectPhases)
        .where(inArray(projectPhases.id, phaseIds));

      if (existingPhases.length !== phaseIds.length) {
        return NextResponse.json(
          { error: 'Una o más fases no existen' },
          { status: 400 }
        );
      }
    }

    // Usar transacción para eliminación + inserción
    // Eliminar las asignaciones existentes
    await db
      .delete(projectTypePhases)
      .where(eq(projectTypePhases.projectTypeId, validated.projectTypeId));

    // Insertar las nuevas asignaciones
    if (validated.phases.length > 0) {
      await db.insert(projectTypePhases).values(
        validated.phases.map((phase) => ({
          projectTypeId: validated.projectTypeId,
          phaseId: phase.phaseId,
          order: phase.order,
          isRequired: phase.isRequired,
        }))
      );
    }

    // Obtener y retornar el resultado final
    const result = await db
      .select({
        id: projectTypePhases.id,
        projectTypeId: projectTypePhases.projectTypeId,
        phaseId: projectTypePhases.phaseId,
        phaseName: projectPhases.name,
        phaseDescription: projectPhases.description,
        order: projectTypePhases.order,
        isRequired: projectTypePhases.isRequired,
      })
      .from(projectTypePhases)
      .innerJoin(projectPhases, eq(projectTypePhases.phaseId, projectPhases.id))
      .where(eq(projectTypePhases.projectTypeId, validated.projectTypeId))
      .orderBy(projectTypePhases.order);

    return NextResponse.json(
      { message: 'Fases asignadas exitosamente', data: result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.issues },
        { status: 400 }
      );
    }
    console.error('❌ Error al asignar fases:', error);
    return NextResponse.json(
      { error: 'Error al asignar fases' },
      { status: 500 }
    );
  }
}
