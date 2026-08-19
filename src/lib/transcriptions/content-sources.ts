/**
 * Resuelve, para cada tipo de contenido de Artiefy, cuáles videos existen y
 * dónde está su key en la base de datos.
 *
 * Aísla las consultas de Drizzle del cliente de transcripción, para que
 * agregar un tipo nuevo de contenido sea tocar solo este archivo.
 */

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  classMeetings,
  guidedObjectiveActivities,
  guidedObjectives,
  guidedProjects,
  lessons,
} from '~/server/db/schema';

import type { ContentType } from './whisper-vps';

/** Un video concreto listo para transcribir. */
export interface VideoSource {
  type: ContentType;
  contentId: number;
  title: string;
  videoKey: string;
}

/**
 * Todos los videos de un curso: sus clases y sus grabaciones de Teams.
 *
 * Las grabaciones de Teams pueden tener hasta dos archivos (`video_key` y
 * `video_key_2`) o una URL externa. Se toma el primero disponible: transcribir
 * ambas partes de la misma reunión duplicaría el contenido.
 */
export async function getCourseVideos(
  courseId: number
): Promise<VideoSource[]> {
  const [courseLessons, meetings] = await Promise.all([
    db
      .select({
        id: lessons.id,
        title: lessons.title,
        videoKey: lessons.coverVideoKey,
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId)),
    db
      .select({
        id: classMeetings.id,
        title: classMeetings.title,
        videoKey: classMeetings.video_key,
        videoKey2: classMeetings.video_key_2,
        videoUrlExt: classMeetings.videoUrlExt,
      })
      .from(classMeetings)
      .where(eq(classMeetings.courseId, courseId)),
  ]);

  const sources: VideoSource[] = [];

  for (const lesson of courseLessons) {
    if (lesson.videoKey) {
      sources.push({
        type: 'lesson',
        contentId: lesson.id,
        title: lesson.title,
        videoKey: lesson.videoKey,
      });
    }
  }

  for (const meeting of meetings) {
    const key = meeting.videoKey ?? meeting.videoKey2 ?? meeting.videoUrlExt;
    if (key) {
      sources.push({
        type: 'meeting',
        contentId: meeting.id,
        title: meeting.title,
        videoKey: key,
      });
    }
  }

  return sources;
}

/**
 * Todos los videos de un proyecto guiado: el del proyecto, los de sus
 * objetivos y los de instrucción de sus actividades.
 */
export async function getGuidedProjectVideos(
  projectId: number
): Promise<VideoSource[]> {
  const sources: VideoSource[] = [];

  const project = await db
    .select({
      id: guidedProjects.id,
      title: guidedProjects.title,
      videoKey: guidedProjects.coverVideoKey,
    })
    .from(guidedProjects)
    .where(eq(guidedProjects.id, projectId))
    .then((rows) => rows[0]);

  if (project?.videoKey) {
    sources.push({
      type: 'project',
      contentId: project.id,
      title: project.title,
      videoKey: project.videoKey,
    });
  }

  const objectives = await db
    .select({
      id: guidedObjectives.id,
      title: guidedObjectives.title,
      videoKey: guidedObjectives.coverVideoKey,
    })
    .from(guidedObjectives)
    .where(eq(guidedObjectives.guidedProjectId, projectId));

  for (const objective of objectives) {
    if (objective.videoKey) {
      sources.push({
        type: 'objective',
        contentId: objective.id,
        title: objective.title,
        videoKey: objective.videoKey,
      });
    }
  }

  // Las actividades cuelgan de los objetivos, no del proyecto: hay que
  // buscarlas objetivo por objetivo.
  for (const objective of objectives) {
    const activities = await db
      .select({
        id: guidedObjectiveActivities.id,
        name: guidedObjectiveActivities.name,
        videoKey: guidedObjectiveActivities.instructionVideoKey,
      })
      .from(guidedObjectiveActivities)
      .where(eq(guidedObjectiveActivities.objectiveId, objective.id));

    for (const activity of activities) {
      if (activity.videoKey) {
        sources.push({
          type: 'activity',
          contentId: activity.id,
          title: activity.name,
          videoKey: activity.videoKey,
        });
      }
    }
  }

  return sources;
}

/** Un solo video, identificado por tipo e id. */
export async function getSingleVideo(
  type: ContentType,
  contentId: number
): Promise<VideoSource | null> {
  switch (type) {
    case 'lesson': {
      const row = await db
        .select({
          id: lessons.id,
          title: lessons.title,
          videoKey: lessons.coverVideoKey,
        })
        .from(lessons)
        .where(eq(lessons.id, contentId))
        .then((rows) => rows[0]);
      if (!row?.videoKey) return null;
      return {
        type,
        contentId: row.id,
        title: row.title,
        videoKey: row.videoKey,
      };
    }

    case 'meeting': {
      const row = await db
        .select({
          id: classMeetings.id,
          title: classMeetings.title,
          videoKey: classMeetings.video_key,
          videoKey2: classMeetings.video_key_2,
          videoUrlExt: classMeetings.videoUrlExt,
        })
        .from(classMeetings)
        .where(eq(classMeetings.id, contentId))
        .then((rows) => rows[0]);
      const key = row?.videoKey ?? row?.videoKey2 ?? row?.videoUrlExt;
      if (!row || !key) return null;
      return { type, contentId: row.id, title: row.title, videoKey: key };
    }

    case 'project': {
      const row = await db
        .select({
          id: guidedProjects.id,
          title: guidedProjects.title,
          videoKey: guidedProjects.coverVideoKey,
        })
        .from(guidedProjects)
        .where(eq(guidedProjects.id, contentId))
        .then((rows) => rows[0]);
      if (!row?.videoKey) return null;
      return {
        type,
        contentId: row.id,
        title: row.title,
        videoKey: row.videoKey,
      };
    }

    case 'objective': {
      const row = await db
        .select({
          id: guidedObjectives.id,
          title: guidedObjectives.title,
          videoKey: guidedObjectives.coverVideoKey,
        })
        .from(guidedObjectives)
        .where(eq(guidedObjectives.id, contentId))
        .then((rows) => rows[0]);
      if (!row?.videoKey) return null;
      return {
        type,
        contentId: row.id,
        title: row.title,
        videoKey: row.videoKey,
      };
    }

    case 'activity': {
      const row = await db
        .select({
          id: guidedObjectiveActivities.id,
          name: guidedObjectiveActivities.name,
          videoKey: guidedObjectiveActivities.instructionVideoKey,
        })
        .from(guidedObjectiveActivities)
        .where(eq(guidedObjectiveActivities.id, contentId))
        .then((rows) => rows[0]);
      if (!row?.videoKey) return null;
      return {
        type,
        contentId: row.id,
        title: row.name,
        videoKey: row.videoKey,
      };
    }

    default:
      return null;
  }
}
