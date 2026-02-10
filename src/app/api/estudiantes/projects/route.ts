import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  projectActivities,
  projects,
  specificObjectives,
} from '~/server/db/schema';

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

    // Obtener proyectos del curso para este usuario con el nombre de la categoría
    let userProjects;
    try {
      userProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          planteamiento: projects.planteamiento,
          justificacion: projects.justificacion,
          objetivo_general: projects.objetivo_general,
          requirements: projects.requirements,
          coverImageKey: projects.coverImageKey,
          coverVideoKey: projects.coverVideoKey,
          multimedia: projects.multimedia,
          type_project: projects.type_project,
          projectTypeId: projects.projectTypeId,
          userId: projects.userId,
          courseId: projects.courseId,
          categoryId: projects.categoryId,
          categoryName: categories.name,
          isPublic: projects.isPublic,
          needsCollaborators: projects.needsCollaborators,
          publicComment: projects.publicComment,
          fecha_inicio: projects.fecha_inicio,
          fecha_fin: projects.fecha_fin,
          duration_unit: projects.duration_unit,
          tipo_visualizacion: projects.tipo_visualizacion,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          horas_por_dia: projects.horas_por_dia,
          total_horas: projects.total_horas,
          tiempo_estimado: projects.tiempo_estimado,
        })
        .from(projects)
        .leftJoin(categories, eq(projects.categoryId, categories.id))
        .where(
          and(
            eq(projects.userId, userId),
            eq(projects.courseId, parseInt(courseId))
          )
        );
    } catch (queryError) {
      const errorCode = (queryError as { cause?: { code?: string } })?.cause
        ?.code;
      if (errorCode !== '42703') {
        throw queryError;
      }

      userProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          planteamiento: projects.planteamiento,
          justificacion: projects.justificacion,
          objetivo_general: projects.objetivo_general,
          requirements: projects.requirements,
          coverImageKey: projects.coverImageKey,
          coverVideoKey: projects.coverVideoKey,
          multimedia: projects.multimedia,
          type_project: projects.type_project,
          projectTypeId: projects.projectTypeId,
          userId: projects.userId,
          courseId: projects.courseId,
          categoryId: projects.categoryId,
          categoryName: categories.name,
          isPublic: projects.isPublic,
          needsCollaborators: projects.needsCollaborators,
          publicComment: projects.publicComment,
          fecha_inicio: projects.fecha_inicio,
          fecha_fin: projects.fecha_fin,
          duration_unit: projects.duration_unit,
          tipo_visualizacion: projects.tipo_visualizacion,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          horas_por_dia: projects.horas_por_dia,
          total_horas: projects.total_horas,
          tiempo_estimado: projects.tiempo_estimado,
        })
        .from(projects)
        .leftJoin(categories, eq(projects.categoryId, categories.id))
        .where(
          and(
            eq(projects.userId, userId),
            eq(projects.courseId, parseInt(courseId))
          )
        );
    }

    const projectIds = userProjects.map((project) => project.id);

    const objectivesByProject = new Map<number, number>();
    const cronogramaByProject = new Map<number, boolean>();

    if (projectIds.length > 0) {
      const objectives = await db
        .select({ projectId: specificObjectives.projectId })
        .from(specificObjectives)
        .where(inArray(specificObjectives.projectId, projectIds));

      objectives.forEach((obj) => {
        objectivesByProject.set(
          obj.projectId,
          (objectivesByProject.get(obj.projectId) ?? 0) + 1
        );
      });

      const activitiesWithDates = await db
        .select({
          projectId: projectActivities.projectId,
          startDate: projectActivities.startDate,
          endDate: projectActivities.endDate,
        })
        .from(projectActivities)
        .where(inArray(projectActivities.projectId, projectIds));

      activitiesWithDates.forEach((activity) => {
        if (activity.startDate && activity.endDate) {
          cronogramaByProject.set(activity.projectId, true);
        }
      });
    }

    const projectsWithProgress = userProjects.map((project) => {
      const hasBasicInfo = Boolean(
        project.name?.trim() &&
        ((project.description ?? '').trim() ||
          (project.planteamiento ?? '').trim())
      );
      const hasProblemaJustificacion = Boolean(
        project.planteamiento?.trim() && project.justificacion?.trim()
      );
      const hasObjetivoGeneral = Boolean(project.objetivo_general?.trim());
      const hasRequisitos = (() => {
        if (!project.requirements) return false;
        try {
          const parsed = JSON.parse(project.requirements) as unknown;
          return Array.isArray(parsed) && parsed.some((item) => item?.trim?.());
        } catch {
          return false;
        }
      })();
      const hasDuracion = Boolean(project.fecha_inicio && project.fecha_fin);
      const hasObjetivosEspecificos =
        (objectivesByProject.get(project.id) ?? 0) > 0;
      const hasCronograma = cronogramaByProject.get(project.id) ?? false;

      const completedSections = [
        hasBasicInfo,
        hasProblemaJustificacion,
        hasObjetivoGeneral,
        hasRequisitos,
        hasDuracion,
        hasObjetivosEspecificos,
        hasCronograma,
      ].filter(Boolean).length;

      return {
        ...project,
        progressPercentage: Math.round((completedSections / 7) * 100),
      };
    });

    return NextResponse.json(projectsWithProgress, { status: 200 });
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
