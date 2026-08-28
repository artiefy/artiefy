/**
 * Recolecta el contenido textual de un proyecto guiado para generar
 * embeddings: el proyecto en sí, sus objetivos y las actividades de cada
 * objetivo.
 *
 * Es el equivalente de `course-processor.ts` pero para `guided_projects`,
 * que es una tabla aparte y no un curso.
 */

import { eq, inArray } from 'drizzle-orm';

import { readTranscriptions } from '~/lib/transcriptions/read-many';
import { db } from '~/server/db';
import {
  guidedObjectiveActivities,
  guidedObjectives,
  guidedProjects,
} from '~/server/db/schema';

import { estimateTokens } from './utils';

export interface GuidedProjectContentData {
  projectId: number;
  projectTitle: string;
  projectContent: string;
  sources: {
    type: 'project' | 'objective' | 'activity';
    name: string;
  }[];
  totalTokens: number;
}

/** Agrega una sección al texto solo si tiene contenido real. */
function pushSection(parts: string[], label: string, value?: string | null) {
  const trimmed = value?.trim();
  if (trimmed) {
    parts.push(`${label}: ${trimmed}`);
  }
}

export async function getGuidedProjectContentForEmbeddings(
  projectId: number
): Promise<GuidedProjectContentData> {
  console.log(`🚀 Procesando proyecto guiado ${projectId}...`);

  const project = await db.query.guidedProjects.findFirst({
    where: eq(guidedProjects.id, projectId),
  });

  if (!project) {
    throw new Error(`Proyecto guiado ${projectId} no encontrado`);
  }

  const contentParts: string[] = [];
  const sources: GuidedProjectContentData['sources'] = [];

  // 1) El proyecto y todos sus campos descriptivos. Estos textos son los que
  //    más valor tienen para la búsqueda semántica: explican de qué va el
  //    proyecto, qué se construye y qué se necesita saber antes.
  contentParts.push(`=== PROYECTO GUIADO: ${project.title} ===`);
  pushSection(contentParts, 'Subtítulo', project.subtitle);
  pushSection(contentParts, 'Descripción', project.description);
  pushSection(contentParts, 'Problema que resuelve', project.problemStatement);
  pushSection(contentParts, 'Cómo funciona', project.howItWorks);
  pushSection(contentParts, 'Qué vas a construir', project.whatYouWillBuild);
  pushSection(contentParts, 'Requisitos previos', project.prerequisites);
  pushSection(contentParts, 'Tecnologías', project.techStack);
  pushSection(contentParts, 'Entregables', project.deliverablesDescription);

  if (project.faqItems?.length) {
    contentParts.push('--- PREGUNTAS FRECUENTES ---');
    for (const item of project.faqItems) {
      contentParts.push(`P: ${item.question}`);
      contentParts.push(`R: ${item.answer}`);
    }
  }

  sources.push({ type: 'project', name: project.title });

  // 2) Objetivos (o sesiones) del proyecto
  const objectives = await db
    .select({
      id: guidedObjectives.id,
      title: guidedObjectives.title,
      description: guidedObjectives.description,
      duration: guidedObjectives.duration,
      orderIndex: guidedObjectives.orderIndex,
    })
    .from(guidedObjectives)
    .where(eq(guidedObjectives.guidedProjectId, projectId))
    .orderBy(guidedObjectives.orderIndex);

  console.log(`ℹ️ Objetivos encontrados: ${objectives.length}`);

  for (const objective of objectives) {
    contentParts.push(`--- OBJETIVO: ${objective.title} ---`);
    pushSection(contentParts, 'Descripción', objective.description);
    if (objective.duration) {
      contentParts.push(`Duración: ${objective.duration} minutos`);
    }
    sources.push({ type: 'objective', name: objective.title });

    // 3) Actividades del objetivo. Las actividades cuelgan del objetivo, no
    //    del proyecto, así que hay que recorrerlas objetivo por objetivo.
    const activities = await db
      .select({
        id: guidedObjectiveActivities.id,
        name: guidedObjectiveActivities.name,
        description: guidedObjectiveActivities.description,
        instructionText: guidedObjectiveActivities.instructionText,
        porcentaje: guidedObjectiveActivities.porcentaje,
      })
      .from(guidedObjectiveActivities)
      .where(eq(guidedObjectiveActivities.objectiveId, objective.id));

    for (const activity of activities) {
      contentParts.push(`  ACTIVIDAD: ${activity.name}`);
      pushSection(contentParts, '  Descripción', activity.description);
      pushSection(contentParts, '  Instrucciones', activity.instructionText);
      if (activity.porcentaje !== null) {
        contentParts.push(`  Porcentaje: ${activity.porcentaje}%`);
      }
      sources.push({
        type: 'activity',
        name: `${activity.name} (en ${objective.title})`,
      });
    }
  }

  // Transcripciones de los videos del proyecto, sus objetivos y las
  // instrucciones de sus actividades. Lo hablado en el video suele explicar
  // mucho más que la descripción escrita.
  try {
    const activityIds = (
      await db
        .select({ id: guidedObjectiveActivities.id })
        .from(guidedObjectiveActivities)
        .where(
          inArray(
            guidedObjectiveActivities.objectiveId,
            objectives.length > 0 ? objectives.map((o) => o.id) : [-1]
          )
        )
    ).map((a) => a.id);

    const transcripciones = await readTranscriptions([
      { type: 'project', contentId: projectId },
      ...objectives.map((o) => ({
        type: 'objective' as const,
        contentId: o.id,
      })),
      ...activityIds.map((id) => ({
        type: 'activity' as const,
        contentId: id,
      })),
    ]);

    if (transcripciones.length > 0) {
      contentParts.push('');
      contentParts.push('=== TRANSCRIPCIONES DE LOS VIDEOS ===');
      for (const t of transcripciones) {
        contentParts.push(`--- ${t.type} ${t.contentId} ---`);
        contentParts.push(t.text);
      }
      console.log(`🎙️ ${transcripciones.length} transcripciones incorporadas`);
    }
  } catch (error) {
    console.error('⚠️ No se pudieron leer las transcripciones:', error);
  }

  const projectContent = contentParts.join('\n');
  const totalTokens = estimateTokens(projectContent);

  console.log(
    `✅ Proyecto ${projectId}: ${sources.length} fuentes, ~${totalTokens} tokens`
  );

  return {
    projectId,
    projectTitle: project.title,
    projectContent,
    sources,
    totalTokens,
  };
}
