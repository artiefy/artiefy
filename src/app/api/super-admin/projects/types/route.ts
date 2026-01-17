import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db/index';
import { projectTypes } from '~/server/db/schema';

// ✅ Validaciones con Zod
const createProjectTypeSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateProjectTypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, 'Nombre requerido').max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const deleteProjectTypeSchema = z.object({
  id: z.number().int().positive(),
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

// ✅ GET: Listar tipos de proyecto
export async function GET() {
  try {
    const authCheck = await checkSuperAdmin();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const result = await db.select().from(projectTypes);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener tipos de proyecto:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipos de proyecto' },
      { status: 500 }
    );
  }
}

// ✅ POST: Crear tipo de proyecto
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
    const validated = createProjectTypeSchema.parse(body);

    // Verificar si el nombre ya existe
    const existing = await db
      .select()
      .from(projectTypes)
      .where(eq(projectTypes.name, validated.name));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Este nombre de tipo de proyecto ya existe' },
        { status: 400 }
      );
    }

    const result = await db
      .insert(projectTypes)
      .values({
        name: validated.name,
        description: validated.description || null,
        isActive: validated.isActive,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.issues },
        { status: 400 }
      );
    }
    console.error('❌ Error al crear tipo de proyecto:', error);
    return NextResponse.json(
      { error: 'Error al crear tipo de proyecto' },
      { status: 500 }
    );
  }
}

// ✅ PUT: Actualizar tipo de proyecto
export async function PUT(req: Request) {
  try {
    const authCheck = await checkSuperAdmin();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = (await req.json()) as unknown;
    const validated = updateProjectTypeSchema.parse(body);

    // Verificar que existe
    const existing = await db
      .select()
      .from(projectTypes)
      .where(eq(projectTypes.id, validated.id));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Si se actualiza el nombre, verificar que no exista otro con ese nombre
    if (validated.name && validated.name !== existing[0].name) {
      const duplicate = await db
        .select()
        .from(projectTypes)
        .where(eq(projectTypes.name, validated.name));

      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: 'Este nombre de tipo de proyecto ya existe' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;

    const result = await db
      .update(projectTypes)
      .set(updateData)
      .where(eq(projectTypes.id, validated.id))
      .returning();

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.issues },
        { status: 400 }
      );
    }
    console.error('❌ Error al actualizar tipo de proyecto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tipo de proyecto' },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Soft delete (marcar como inactivo)
export async function DELETE(req: Request) {
  try {
    const authCheck = await checkSuperAdmin();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = (await req.json()) as unknown;
    const validated = deleteProjectTypeSchema.parse(body);

    const existing = await db
      .select()
      .from(projectTypes)
      .where(eq(projectTypes.id, validated.id));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como inactivo
    const result = await db
      .update(projectTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(projectTypes.id, validated.id))
      .returning();

    return NextResponse.json(
      { message: 'Tipo de proyecto eliminado', data: result[0] },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validación fallida', details: error.issues },
        { status: 400 }
      );
    }
    console.error('❌ Error al eliminar tipo de proyecto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tipo de proyecto' },
      { status: 500 }
    );
  }
}
