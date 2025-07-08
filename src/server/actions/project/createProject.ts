'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectActivities,
  projects,
  projectSchedule,
  specificObjectives,
  users,
} from '~/server/db/schema';

interface ProjectData {
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  objetivos_especificos?: string[];
  actividades?: {
    descripcion: string;
    meses: number[]; // Ej: [0, 1, 2] para Ene-Feb-Mar
  }[];
  integrantes?: number[]; // Aún no usados
  coverImageKey?: string; // ya está incluido
  type_project: string;
  categoryId: number;
  isPublic?: boolean; // <-- nuevo campo opcional
}

// Crear proyecto, objetivos específicos, actividades y cronograma
export async function createProject(
  projectData: ProjectData
): Promise<{ id: number }> {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }
  const UserId = user.id;
  console.log('🟡 Datos recibidos:', UserId);

  // Verificar si el usuario existe en la base de datos, si no, crearlo (igual que enrollInCourse)
  let dbUser = await db.query.users.findFirst({
    where: eq(users.id, UserId),
  });

  if (!dbUser) {
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail?.emailAddress) {
      throw new Error('No se pudo obtener el email del usuario');
    }

    try {
      await db.insert(users).values({
        id: UserId,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : (user.firstName ?? 'Usuario'),
        email: primaryEmail.emailAddress,
        role: 'estudiante',
        subscriptionStatus: 'inactive', // o 'active' si aplica lógica de suscripción
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verificar que el usuario se creó correctamente
      dbUser = await db.query.users.findFirst({
        where: eq(users.id, UserId),
      });

      if (!dbUser) {
        throw new Error('Error al crear el usuario en la base de datos');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Error al crear el usuario en la base de datos');
    }
  }

  // 1. Crear el proyecto
  const insertedProjects = await db
    .insert(projects)
    .values({
      name: projectData.name,
      planteamiento: projectData.planteamiento,
      justificacion: projectData.justificacion,
      objetivo_general: projectData.objetivo_general,
      coverImageKey: projectData.coverImageKey ?? null, // <-- asegúrate de usar este campo
      type_project: projectData.type_project,
      userId: UserId,
      categoryId: projectData.categoryId,
      isPublic: projectData.isPublic ?? false, // <-- por defecto false
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: projects.id });

  const projectId = insertedProjects[0]?.id;
  if (!projectId) {
    throw new Error('No se pudo crear el proyecto');
  }

  // 2. Insertar objetivos específicos
  if (
    projectData.objetivos_especificos &&
    projectData.objetivos_especificos.length > 0
  ) {
    const objetivosData = projectData.objetivos_especificos.map((desc) => ({
      projectId,
      description: desc,
      createdAt: new Date(),
    }));
    await db.insert(specificObjectives).values(objetivosData);
  }

  // 3. Insertar actividades y cronograma
  if (projectData.actividades && projectData.actividades.length > 0) {
    for (const actividad of projectData.actividades) {
      // Insertar actividad
      const [insertedActividad] = await db
        .insert(projectActivities)
        .values({
          projectId,
          description: actividad.descripcion,
        })
        .returning({ id: projectActivities.id });

      const actividadId = insertedActividad?.id;

      // Insertar meses del cronograma
      if (actividadId && actividad.meses.length > 0) {
        const scheduleData = actividad.meses.map((mes) => ({
          activityId: actividadId,
          month: mes,
        }));
        await db.insert(projectSchedule).values(scheduleData);
      }
    }
  }

  return { id: projectId };
}
