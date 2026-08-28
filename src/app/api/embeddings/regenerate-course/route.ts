/**
 * POST /api/embeddings/regenerate-course
 * Regenera embeddings para todo un curso
 *
 * Body:
 * {
 *   courseId: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { processDocument } from '~/lib/embeddings/processor';
import {
  deleteCourseEmbeddings,
  saveDocumentEmbeddings,
} from '~/lib/embeddings/search';
import { db } from '~/server/db';
import { courses, documentEmbeddings } from '~/server/db/schema';
import {
  activities,
  enrollments,
  forums,
  lessons,
  materias,
} from '~/server/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json();

    // Validación
    if (!courseId) {
      return NextResponse.json(
        { error: 'Falta parámetro requerido: courseId' },
        { status: 400 }
      );
    }

    const courseIdNum =
      typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    if (isNaN(courseIdNum)) {
      return NextResponse.json(
        { error: 'courseId debe ser un número válido' },
        { status: 400 }
      );
    }

    // Obtener curso
    const courseResult = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseIdNum));

    if (!courseResult || courseResult.length === 0) {
      return NextResponse.json(
        { error: `Curso con ID ${courseIdNum} no encontrado` },
        { status: 404 }
      );
    }

    const course = courseResult[0];
    console.log(`🔄 Regenerando embeddings para curso: ${course.title}`);

    // Eliminar embeddings anteriores
    await deleteCourseEmbeddings(String(courseIdNum));
    console.log(`🗑️ Embeddings anteriores eliminados`);

    // Función para extraer contenido por secciones
    const sections: Array<{
      title: string;
      content: string;
      type: string;
      source: string;
    }> = [];

    // SECCIÓN 1: INFORMACIÓN DEL CURSO
    let courseInfo = `# CURSO: ${course.title}\n\n`;
    if (course.description) {
      courseInfo += `**Descripción:** ${course.description}\n\n`;
    }
    if (course.instructor) {
      courseInfo += `**Instructor:** ${course.instructor}\n\n`;
    }
    if (course.rating) {
      courseInfo += `**Calificación:** ${course.rating}/5\n\n`;
    }

    sections.push({
      title: `Información - ${course.title}`,
      content: courseInfo,
      type: 'course-info',
      source: `course-${courseIdNum}-info`,
    });

    // SECCIÓN 2: LECCIONES
    const lessonsData = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseIdNum));

    if (lessonsData.length > 0) {
      let lessonsContent = `# LECCIONES DEL CURSO\n\n`;
      lessonsData.forEach((lesson) => {
        lessonsContent += `## ${lesson.title}\n\n`;
        if (lesson.description) {
          lessonsContent += `${lesson.description}\n\n`;
        }
        if (lesson.duration) {
          lessonsContent += `**Duración:** ${lesson.duration} minutos\n\n`;
        }
      });

      sections.push({
        title: `Lecciones - ${course.title}`,
        content: lessonsContent,
        type: 'lessons',
        source: `course-${courseIdNum}-lessons`,
      });
    }

    // SECCIÓN 3: ACTIVIDADES
    const activitiesData = await db
      .select()
      .from(activities)
      .innerJoin(lessons, eq(activities.lessonsId, lessons.id))
      .where(eq(lessons.courseId, courseIdNum));

    if (activitiesData.length > 0) {
      let activitiesContent = `# ACTIVIDADES\n\n`;
      activitiesData.forEach(({ activities: activity }) => {
        activitiesContent += `## ${activity.name}\n\n`;
        if (activity.description) {
          activitiesContent += `${activity.description}\n\n`;
        }
        if (activity.porcentaje) {
          activitiesContent += `**Porcentaje:** ${activity.porcentaje}%\n\n`;
        }
      });

      sections.push({
        title: `Actividades - ${course.title}`,
        content: activitiesContent,
        type: 'activities',
        source: `course-${courseIdNum}-activities`,
      });
    }

    // SECCIÓN 4: FOROS
    const forumsData = await db
      .select()
      .from(forums)
      .where(eq(forums.courseId, courseIdNum));

    if (forumsData.length > 0) {
      let forumsContent = `# FOROS DE DISCUSIÓN\n\n`;
      forumsData.forEach((forum) => {
        forumsContent += `## ${forum.title}\n\n`;
        if (forum.description) {
          forumsContent += `${forum.description}\n\n`;
        }
      });

      sections.push({
        title: `Foros - ${course.title}`,
        content: forumsContent,
        type: 'forums',
        source: `course-${courseIdNum}-forums`,
      });
    }

    // SECCIÓN 5: MATERIAS
    const materiasData = await db
      .select()
      .from(materias)
      .where(eq(materias.courseid, courseIdNum));

    if (materiasData.length > 0) {
      let materiasContent = `# MATERIAS ASOCIADAS\n\n`;
      materiasData.forEach((materia) => {
        materiasContent += `- ${materia.title}\n`;
      });

      sections.push({
        title: `Materias - ${course.title}`,
        content: materiasContent,
        type: 'materias',
        source: `course-${courseIdNum}-materias`,
      });
    }

    // SECCIÓN 6: INSCRIPCIONES
    const enrollmentsData = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseIdNum));

    let enrollmentsContent = `# INFORMACIÓN DE INSCRIPCIONES\n\n`;
    enrollmentsContent += `**Cantidad de alumnos inscritos:** ${enrollmentsData.length}\n\n`;

    const completedCount = enrollmentsData.filter((e) => e.completed).length;
    const completionRate =
      enrollmentsData.length > 0
        ? Math.round((completedCount / enrollmentsData.length) * 100)
        : 0;
    enrollmentsContent += `**Tasa de compleción:** ${completionRate}%\n\n`;

    const permanentCount = enrollmentsData.filter((e) => e.isPermanent).length;
    enrollmentsContent += `**Inscripciones permanentes:** ${permanentCount}\n\n`;

    sections.push({
      title: `Inscripciones - ${course.title}`,
      content: enrollmentsContent,
      type: 'enrollments',
      source: `course-${courseIdNum}-enrollments`,
    });

    // SECCIÓN 7: DURACIÓN
    let durationContent = `# DURACIÓN DEL CURSO\n\n`;

    const totalDuration = lessonsData.reduce((sum, lesson) => {
      const duration = lesson.duration || 0;
      return sum + duration;
    }, 0);

    durationContent += `**Total de lecciones:** ${lessonsData.length}\n\n`;
    durationContent += `**Duración total:** ${totalDuration} minutos (${Math.round(totalDuration / 60)} horas)\n\n`;

    const avgDuration =
      lessonsData.length > 0
        ? Math.round(totalDuration / lessonsData.length)
        : 0;
    durationContent += `**Duración promedio por lección:** ${avgDuration} minutos\n\n`;

    if (lessonsData.length > 0) {
      durationContent += `## Desglose por lección:\n\n`;
      lessonsData.forEach((lesson) => {
        const duration = lesson.duration || 0;
        durationContent += `- **${lesson.title}**: ${duration} minutos\n`;
      });
    }

    sections.push({
      title: `Duración - ${course.title}`,
      content: durationContent,
      type: 'duration',
      source: `course-${courseIdNum}-duration`,
    });

    // Procesar cada sección y generar embeddings
    // Se limpia una sola vez, ANTES del bucle: cada vuelta guarda una seccion
    // distinta del mismo curso, asi que borrar dentro del bucle se llevaria
    // por delante las secciones ya guardadas.
    const borradas = await db
      .delete(documentEmbeddings)
      .where(eq(documentEmbeddings.courseId, courseIdNum))
      .returning({ id: documentEmbeddings.id });
    console.log(`🧹 Eliminados ${borradas.length} fragmentos anteriores`);

    let totalSections = 0;
    let totalTokens = 0;

    for (const section of sections) {
      try {
        console.log(`📄 Procesando sección: ${section.type}`);
        const documents = await processDocument(
          section.content,
          section.title,
          1000,
          200
        );

        // Contar tokens (aproximado: 4 caracteres = 1 token)
        const sectionTokens = Math.ceil(section.content.length / 4);
        totalTokens += sectionTokens;

        // Guardar embeddings
        const saved = await saveDocumentEmbeddings(
          String(courseIdNum),
          documents
        );
        totalSections += saved;

        console.log(
          `✅ Sección ${section.type}: ${saved} documentos guardados (${sectionTokens} tokens)`
        );
      } catch (error) {
        console.error(`❌ Error procesando sección ${section.type}:`, error);
        // Continuar con otras secciones
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Embeddings del curso regenerados exitosamente`,
        stats: {
          courseId: courseIdNum,
          courseName: course.title,
          totalSections,
          totalTokens,
          sections: sections.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error regenerando embeddings:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
