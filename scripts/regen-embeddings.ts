#!/usr/bin/env tsx
/**
 * Script para regenerar embeddings de documentos
 * Procesa contenido de cursos y genera embeddings vectoriales
 *
 * Uso:
 *   npm run embeddings:regen -- --courseId=123
 *   npm run embeddings:regen -- --all
 *   npx tsx scripts/regen-embeddings.ts --courseId=123
 */

// Cargar variables de entorno desde .env
import 'dotenv/config';

import {
  processDocument,
  getDocumentStats,
} from '../src/lib/embeddings/processor';
import {
  saveDocumentEmbeddings,
  deleteCourseEmbeddings,
} from '../src/lib/embeddings/search';
import { db } from '../src/server/db';
import {
  courses,
  lessons,
  activities,
  forums,
  posts,
  postReplies,
  enrollments,
  materias,
} from '../src/server/db/schema';
import { eq } from 'drizzle-orm';

import 'dotenv/config';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('ERROR: Falta OPENAI_API_KEY en el entorno');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string | boolean> = {};
  for (const a of args) {
    const [k, v] = a.includes('=') ? a.split('=') : [a, 'true'];
    out[k.replace(/^--/, '')] = v === 'true' ? true : v === 'false' ? false : v;
  }
  return out;
}

/**
 * Función para extraer contenido del curso dividido en secciones
 * Retorna un array de documentos por sección para mejor búsqueda
 */
async function extractCourseSections(
  courseId: number
): Promise<{ title: string; content: string; type: string; source: string }[]> {
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course || course.length === 0) {
    throw new Error(`Curso con ID ${courseId} no encontrado`);
  }

  const courseData = course[0];
  const sections: {
    title: string;
    content: string;
    type: string;
    source: string;
  }[] = [];

  // ====== SECCIÓN 1: INFORMACIÓN DEL CURSO ======
  let courseInfo = `# CURSO: ${courseData.title}\n\n`;

  if (courseData.description) {
    courseInfo += `**Descripción:** ${courseData.description}\n\n`;
  }

  if (courseData.instructor) {
    courseInfo += `**Instructor:** ${courseData.instructor}\n\n`;
  }

  if (courseData.rating) {
    courseInfo += `**Calificación:** ${courseData.rating}/5\n\n`;
  }

  sections.push({
    title: `Información - ${courseData.title}`,
    content: courseInfo,
    type: 'course-info',
    source: `course-${courseId}-info`,
  });

  // ====== SECCIÓN 2: LECCIONES (UNA POR CADA LECCIÓN) ======
  try {
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    for (const lesson of courseLessons) {
      let lessonContent = `# LECCIÓN: ${lesson.title}\n\n`;

      if (lesson.description) {
        lessonContent += `**Descripción:** ${lesson.description}\n\n`;
      }

      if (lesson.duration) {
        lessonContent += `**Duración:** ${lesson.duration} minutos\n\n`;
      }

      // Obtener actividades de esta lección
      const lessonActivities = await db
        .select()
        .from(activities)
        .where(eq(activities.lessonsId, lesson.id));

      if (lessonActivities.length > 0) {
        lessonContent += `## Actividades en esta lección\n\n`;
        for (const activity of lessonActivities) {
          lessonContent += `- **${activity.name}**`;
          if (activity.description) {
            lessonContent += `: ${activity.description}`;
          }
          if (activity.porcentaje !== null) {
            lessonContent += ` (${activity.porcentaje}%)`;
          }
          lessonContent += `\n`;
        }
        lessonContent += `\n`;
      }

      sections.push({
        title: `Lección ${lesson.orderIndex + 1}: ${lesson.title}`,
        content: lessonContent,
        type: 'lesson',
        source: `course-${courseId}-lesson-${lesson.id}`,
      });
    }
  } catch (error) {
    console.warn(`⚠️ Error extrayendo lecciones: ${error}`);
  }

  // ====== SECCIÓN 3: ACTIVIDADES (TODAS JUNTAS) ======
  try {
    const allLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    if (allLessons.length > 0) {
      const allActivities = await db
        .select()
        .from(activities)
        .where(eq(activities.lessonsId, allLessons[0].id));

      if (allActivities.length > 0) {
        let activitiesContent = `# ACTIVIDADES DEL CURSO\n\n`;

        for (const activity of allActivities) {
          activitiesContent += `## ${activity.name}\n`;
          if (activity.description) {
            activitiesContent += `${activity.description}\n`;
          }
          if (activity.porcentaje !== null) {
            activitiesContent += `**Porcentaje:** ${activity.porcentaje}%\n`;
          }
          if (activity.fechaMaximaEntrega) {
            activitiesContent += `**Fecha máxima:** ${activity.fechaMaximaEntrega}\n`;
          }
          activitiesContent += `\n`;
        }

        sections.push({
          title: 'Todas las Actividades',
          content: activitiesContent,
          type: 'activities',
          source: `course-${courseId}-activities`,
        });
      }
    }
  } catch (error) {
    console.warn(`⚠️ Error extrayendo actividades: ${error}`);
  }

  // ====== SECCIÓN 4: FOROS Y DISCUSIONES ======
  try {
    const courseForos = await db
      .select()
      .from(forums)
      .where(eq(forums.courseId, courseId));

    if (courseForos.length > 0) {
      let forosContent = `# FOROS Y DISCUSIONES DEL CURSO\n\n`;

      for (const foro of courseForos) {
        forosContent += `## Foro: ${foro.title}\n`;
        if (foro.description) {
          forosContent += `${foro.description}\n`;
        }

        // Obtener posts del foro
        const foroPosts = await db
          .select()
          .from(posts)
          .where(eq(posts.forumId, foro.id));

        if (foroPosts.length > 0) {
          forosContent += `\n**Posts en este foro (${foroPosts.length}):**\n`;
          foroPosts.slice(0, 5).forEach((post) => {
            forosContent += `- ${post.content?.substring(0, 100) || 'Sin contenido'}\n`;
          });
          if (foroPosts.length > 5) {
            forosContent += `- ... y ${foroPosts.length - 5} posts más\n`;
          }
        }

        forosContent += `\n`;
      }

      sections.push({
        title: 'Foros y Discusiones',
        content: forosContent,
        type: 'forums',
        source: `course-${courseId}-forums`,
      });
    }
  } catch (error) {
    console.warn(`⚠️ Error extrayendo foros: ${error}`);
  }

  // ====== SECCIÓN 5: MATERIAS ASOCIADAS ======
  try {
    const courseMaterias = await db
      .select()
      .from(materias)
      .where(eq(materias.courseid, courseId));

    if (courseMaterias.length > 0) {
      let materiasContent = `# MATERIAS ASOCIADAS AL CURSO\n\n`;

      for (const materia of courseMaterias) {
        materiasContent += `## ${materia.title}\n`;
        if (materia.description) {
          materiasContent += `${materia.description}\n`;
        }
        materiasContent += `\n`;
      }

      sections.push({
        title: 'Materias Asociadas',
        content: materiasContent,
        type: 'materials',
        source: `course-${courseId}-materias`,
      });
    }
  } catch (error) {
    console.warn(`⚠️ Error extrayendo materias: ${error}`);
  }

  // ====== SECCIÓN 6: ESTADÍSTICAS DE INSCRITOS ======
  try {
    const courseEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    if (courseEnrollments.length > 0) {
      const completedCount = courseEnrollments.filter(
        (e) => e.completed
      ).length;
      const permanentCount = courseEnrollments.filter(
        (e) => e.isPermanent
      ).length;

      let enrollmentContent = `# INFORMACIÓN DE INSCRITOS\n\n`;
      enrollmentContent += `**Total de estudiantes inscritos:** ${courseEnrollments.length}\n`;
      enrollmentContent += `**Estudiantes que completaron:** ${completedCount}\n`;
      enrollmentContent += `**Inscripciones permanentes:** ${permanentCount}\n`;
      enrollmentContent += `**Tasa de finalización:** ${Math.round((completedCount / courseEnrollments.length) * 100)}%\n\n`;

      sections.push({
        title: 'Estadísticas de Inscritos',
        content: enrollmentContent,
        type: 'enrollments',
        source: `course-${courseId}-enrollments`,
      });
    }
  } catch (error) {
    console.warn(`⚠️ Error extrayendo inscritos: ${error}`);
  }

  // ====== SECCIÓN 7: DURACIÓN TOTAL DEL CURSO ======
  try {
    const courseLessonsForDuration = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    if (courseLessonsForDuration.length > 0) {
      const totalDuration = courseLessonsForDuration.reduce(
        (sum, lesson) => sum + (lesson.duration || 0),
        0
      );

      let durationContent = `# DURACIÓN DEL CURSO\n\n`;
      durationContent += `**Total de lecciones:** ${courseLessonsForDuration.length}\n`;
      durationContent += `**Duración total:** ${totalDuration} minutos (${Math.round(totalDuration / 60)} horas)\n`;

      const avgDuration = Math.round(
        totalDuration / courseLessonsForDuration.length
      );
      durationContent += `**Duración promedio por lección:** ${avgDuration} minutos\n\n`;

      durationContent += `## Desglose por lección:\n`;
      courseLessonsForDuration.forEach((lesson) => {
        durationContent += `- **${lesson.title}**: ${lesson.duration || 0} minutos\n`;
      });

      sections.push({
        title: 'Duración y Desglose',
        content: durationContent,
        type: 'duration',
        source: `course-${courseId}-duration`,
      });
    }
  } catch (error) {
    console.warn(`⚠️ Error extrayendo duración: ${error}`);
  }

  return sections;
}

/**
 * Función para extraer TODOS los datos del curso:
 * - Datos básicos (título, descripción, instructor, etc.)
 * - Todas las lecciones y su contenido
 * - Todas las actividades de cada lección
 * - Foros, posts y respuestas
 * - Documentos y recursos asociados
 */
async function extractCourseContent(courseId: number): Promise<string> {
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course || course.length === 0) {
    throw new Error(`Curso con ID ${courseId} no encontrado`);
  }

  const courseData = course[0];
  let content = '';

  // ====== DATOS DEL CURSO ======
  content += `# CURSO: ${courseData.title}\n\n`;

  if (courseData.description) {
    content += `## Descripción\n${courseData.description}\n\n`;
  }

  if (courseData.instructor) {
    content += `**Instructor:** ${courseData.instructor}\n\n`;
  }

  if (courseData.rating) {
    content += `**Calificación:** ${courseData.rating}/5\n\n`;
  }

  // ====== LECCIONES Y ACTIVIDADES ======
  try {
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    if (courseLessons.length > 0) {
      content += `## 📚 Lecciones (${courseLessons.length})\n\n`;

      for (const lesson of courseLessons) {
        content += `### Lección ${lesson.orderIndex + 1}: ${lesson.title}\n`;

        if (lesson.description) {
          content += `${lesson.description}\n`;
        }

        if (lesson.duration) {
          content += `**Duración:** ${lesson.duration} minutos\n`;
        }

        if (lesson.resourceNames) {
          content += `**Recursos:** ${lesson.resourceNames}\n`;
        }

        content += '\n';

        // ====== ACTIVIDADES DE LECCIÓN ======
        const lessonActivities = await db
          .select()
          .from(activities)
          .where(eq(activities.lessonsId, lesson.id));

        if (lessonActivities.length > 0) {
          content += `#### 🎯 Actividades\n`;

          for (const activity of lessonActivities) {
            content += `- **${activity.name}**: ${activity.description || 'Sin descripción'}\n`;

            if (activity.fechaMaximaEntrega) {
              content += `  - Fecha máxima: ${activity.fechaMaximaEntrega}\n`;
            }

            if (activity.porcentaje) {
              content += `  - Porcentaje: ${activity.porcentaje}%\n`;
            }
          }

          content += '\n';
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Error al extraer lecciones:', err);
  }

  // ====== FOROS Y DISCUSIONES ======
  try {
    const courseForum = await db
      .select()
      .from(forums)
      .where(eq(forums.courseId, courseId));

    if (courseForum.length > 0) {
      content += `## 💬 Foros de Discusión\n\n`;

      for (const forum of courseForum) {
        content += `### Foro: ${forum.title}\n`;

        if (forum.description) {
          content += `${forum.description}\n\n`;
        }

        // Traer posts del foro
        const forumPosts = await db
          .select()
          .from(posts)
          .where(eq(posts.forumId, forum.id));

        if (forumPosts.length > 0) {
          content += `**Posts (${forumPosts.length}):**\n`;

          for (const post of forumPosts) {
            content += `- ${post.content}\n`;

            // Traer respuestas del post
            const replies = await db
              .select()
              .from(postReplies)
              .where(eq(postReplies.postId, post.id));

            if (replies.length > 0) {
              for (const reply of replies) {
                content += `  - Respuesta: ${reply.content}\n`;
              }
            }
          }

          content += '\n';
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Error al extraer foros:', err);
  }

  if (!content.trim()) {
    console.warn(`⚠️ Curso ${courseId} sin contenido disponible`);
    return '';
  }

  return content;
}

/**
 * Regenera embeddings para un curso específico
 */
async function regenerateCourseEmbeddings(courseId: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 Regenerando embeddings para curso: ${courseId}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // 1. Extraer secciones del curso
    console.log('📖 Extrayendo contenido del curso por secciones...');
    const courseNum = parseInt(courseId);
    const sections = await extractCourseSections(courseNum);
    const courseIdStr = courseId;

    if (sections.length === 0) {
      console.log('⚠️ Sin contenido para procesar');
      return;
    }

    console.log(`✅ Se extrajeron ${sections.length} secciones`);

    // 2. Procesar cada sección por separado
    console.log('\n⚙️ Procesando secciones y generando embeddings...');
    let totalDocuments = 0;
    let totalTokens = 0;
    const allDocuments: Parameters<typeof saveDocumentEmbeddings>[1] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(
        `\n📄 Procesando sección ${i + 1}/${sections.length}: ${section.title}`
      );

      const documents = await processDocument(
        section.content,
        section.source,
        1000,
        200,
        ({ current, total }) => {
          process.stdout.write(
            `\r⏳ Chunks ${current}/${total} para esta sección...`
          );
        }
      );

      const stats = getDocumentStats(documents);
      console.log(`\n  ✅ ${documents.length} chunks generados`);
      console.log(`  📊 Tokens: ${stats.totalTokens}`);

      totalDocuments += documents.length;
      totalTokens += stats.totalTokens;
      allDocuments.push(...documents);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Estadísticas globales:');
    console.log(`  • Total secciones: ${sections.length}`);
    console.log(`  • Total chunks: ${totalDocuments}`);
    console.log(`  • Tokens totales: ${totalTokens}`);
    console.log(`${'='.repeat(60)}\n`);

    // 3. Eliminar embeddings antiguos
    console.log('🗑️ Eliminando embeddings antiguos...');
    const deleted = await deleteCourseEmbeddings(courseId);
    console.log(`✅ Eliminados ${deleted} embeddings antiguos`);

    // 4. Guardar nuevos embeddings
    console.log('\n💾 Guardando nuevos embeddings...');
    const saved = await saveDocumentEmbeddings(courseIdStr, allDocuments);
    console.log(`✅ Guardados ${saved} embeddings`);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✨ ¡Embeddings regenerados exitosamente!`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error(`\n❌ Error regenerando embeddings:`, error);
    process.exit(1);
  }
}

/**
 * Regenera embeddings para todos los cursos
 */
async function regenerateAllCourses() {
  console.log('\n🌟 Regenerando embeddings para TODOS los cursos...\n');

  try {
    // Obtener todos los cursos
    const allCourses = await db.select({ id: courses.id }).from(courses);

    console.log(`📚 Total de cursos encontrados: ${allCourses.length}`);

    let successCount = 0;
    let failCount = 0;

    for (const course of allCourses) {
      try {
        await regenerateCourseEmbeddings(course.id.toString());
        successCount++;
      } catch (error) {
        console.error(`❌ Error con curso ${course.id}:`, error);
        failCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 Resumen:`);
    console.log(`  ✅ Exitosos: ${successCount}`);
    console.log(`  ❌ Fallidos: ${failCount}`);
    console.log(`${'='.repeat(60)}\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error en regeneración masiva:', error);
    process.exit(1);
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    const args = parseArgs();
    const courseId = args.courseId as string | undefined;
    const all = args.all === true;

    if (courseId) {
      // Regenerar un curso específico
      await regenerateCourseEmbeddings(courseId);
    } else if (all) {
      // Regenerar todos los cursos
      await regenerateAllCourses();
    } else {
      // Mostrar instrucciones de uso
      console.log(`\nUso:`);
      console.log(
        `  • Curso específico: npm run embeddings:regen -- --courseId=123`
      );
      console.log(`  • Todos los cursos: npm run embeddings:regen -- --all\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
