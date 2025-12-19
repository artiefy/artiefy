import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';

// GET - Obtener proyectos de un curso para el usuario actual
export async function GET(req: NextRequest) {
  try {
    const { userId } = (await auth()) as { userId: string | null };

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      );
    }

    // Obtener proyectos del curso para este usuario
    const userProjects = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          eq(projects.categoryId, parseInt(courseId))
        )
      );

    return NextResponse.json(userProjects, { status: 200 });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo proyecto
export async function POST(req: NextRequest) {
  try {
    const { userId } = (await auth()) as { userId: string | null };

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      planteamiento,
      justificacion,
      objetivo_general,
      type_project,
      categoryId,
      coverImageKey,
      isPublic = false,
    } = body;

    // Validar campos requeridos
    if (
      !name ||
      !planteamiento ||
      !justificacion ||
      !objetivo_general ||
      !type_project ||
      !categoryId
    ) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear el proyecto
    const newProject = await db
      .insert(projects)
      .values({
        name,
        planteamiento,
        justificacion,
        objetivo_general,
        type_project,
        userId,
        categoryId: parseInt(categoryId),
        coverImageKey: coverImageKey ?? null,
        isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un proyecto existente
export async function PUT(req: NextRequest) {
  try {
    const { userId } = (await auth()) as { userId: string | null };

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Verificar que el proyecto pertenece al usuario
    const existingProject = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, parseInt(projectId)), eq(projects.userId, userId))
      )
      .then((res) => res[0]);

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado o sin permisos' },
        { status: 404 }
      );
    }

    // Actualizar el proyecto
    const updatedProject = await db
      .update(projects)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, parseInt(projectId)))
      .returning();

    return NextResponse.json(updatedProject[0], { status: 200 });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un proyecto
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = (await auth()) as { userId: string | null };

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el proyecto pertenece al usuario
    const existingProject = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, parseInt(projectId)), eq(projects.userId, userId))
      )
      .then((res) => res[0]);

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado o sin permisos' },
        { status: 404 }
      );
    }

    // Eliminar el proyecto
    await db.delete(projects).where(eq(projects.id, parseInt(projectId)));

    return NextResponse.json(
      { message: 'Proyecto eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
