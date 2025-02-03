"use server";

import { Redis } from "@upstash/redis";
import type { Activity, Question } from "~/types";
import { getRelatedActivities } from "~/server/actions/activities/getRelatedActivities";
import { getUserActivityProgress } from "./getUserActivityProgress";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getActivityContent(lessonId: number, userId: string): Promise<Activity[]> {
  try {
    // Obtener las actividades relacionadas con la lección desde la base de datos
    const relatedActivities = await getRelatedActivities(lessonId);

    if (relatedActivities.length === 0) {
      console.log(`No se encontraron actividades para la lección ${lessonId}`);
      return [];
    }

    // Obtener el progreso del usuario para las actividades
    const userProgress = await getUserActivityProgress(userId);

    // Procesar cada actividad relacionada
    const activitiesWithContent = await Promise.all(
      relatedActivities.map(async (activity) => {
        // Obtener el contenido de la actividad desde Redis
        const contentKey = `activity:${activity.id}:questions`;
        const activityContent = await redis.get(contentKey);

        if (!activityContent) {
          console.log(`No se encontró contenido para la actividad ${activity.id}`);
          return null;
        }

        let parsedContent: Question[];

        // Verificar si activityContent ya es un objeto o un string JSON
        if (typeof activityContent === "string") {
          try {
            parsedContent = JSON.parse(activityContent) as Question[];
          } catch (error) {
            console.error(`Error al parsear el contenido de la actividad ${activity.id}:`, error);
            return null;
          }
        } else if (Array.isArray(activityContent)) {
          parsedContent = activityContent as Question[];
        } else {
          console.error(`Contenido inesperado para la actividad ${activity.id}:`, activityContent);
          return null;
        }

        // Obtener el progreso del usuario para esta actividad
        const activityProgress = userProgress.find(progress => progress.activityId === activity.id);

        // Creamos la estructura completa de Activity
        return {
          ...activity,
          content: {
            questions: parsedContent,
          },
          isCompleted: activityProgress?.isCompleted ?? false,
          userProgress: activityProgress?.progress ?? 0,
        } as Activity;
      })
    );

    // Filtramos las actividades nulas (las que no tenían contenido válido)
    const validActivities = activitiesWithContent.filter((activity): activity is Activity => activity !== null);

    if (validActivities.length === 0) {
      console.log(`No se encontraron actividades con contenido válido para la lección ${lessonId}`);
    } else {
      console.log(`Se encontraron ${validActivities.length} actividades con contenido para la lección ${lessonId}`);
    }

    return validActivities;
  } catch (error) {
    console.error("Error al obtener el contenido de las actividades:", error);
    return [];
  }
}
