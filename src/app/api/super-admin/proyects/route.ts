import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { projects, users } from '~/server/db/schema';

// GET /api/super-admin/proyects?courseId=ID
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'Falta courseId' }, { status: 400 });
    }

    // Los proyectos DEL CURSO, no los de sus estudiantes.
    //
    // Antes se resolvia por inscripciones: se buscaba a los alumnos del curso
    // y se traian todos sus proyectos, incluidos los de otros cursos y los
    // personales. `projects.course_id` es la relacion real.
    let proyectos = [];
    try {
      proyectos = await db
        .select({
          id: projects.id,
          name: projects.name,
          planteamiento: projects.planteamiento,
          justificacion: projects.justificacion,
          objetivo_general: projects.objetivo_general,
          coverImageKey: projects.coverImageKey,
          coverVideoKey: projects.coverVideoKey,
          type_project: projects.type_project,
          userId: projects.userId,
          categoryId: projects.categoryId,
          isPublic: projects.isPublic,
          public_comment: projects.publicComment,
          fecha_inicio: projects.fecha_inicio,
          fecha_fin: projects.fecha_fin,
          tipo_visualizacion: projects.tipo_visualizacion,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          horas_por_dia: projects.horas_por_dia,
          total_horas: projects.total_horas,
          tiempo_estimado: projects.tiempo_estimado,
          dias_estimados: projects.dias_estimados,
          dias_necesarios: projects.dias_necesarios,
          studentName: users.name,
          studentEmail: users.email,
        })
        .from(projects)
        .leftJoin(users, eq(projects.userId, users.id))
        .where(eq(projects.courseId, Number(courseId)));
    } catch (joinError) {
      console.error(
        '[API /api-super-admin/proyects] Join error, fallback to projects only:',
        joinError
      );
      proyectos = await db
        .select()
        .from(projects)
        .where(eq(projects.courseId, Number(courseId)));
    }
    return NextResponse.json(proyectos);
  } catch (error) {
    console.error('[API /api-super-admin/proyects] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
