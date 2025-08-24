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
  objetivos_especificos?: { id: string; title: string }[]; // <-- Cambia a array de objetos
  actividades?: {
    descripcion: string;
    meses: number[]; // Ej: [0, 1, 2] para Ene-Feb-Mar
    objetivoId?: string;
    responsibleUserId?: string; // <-- Añadir
    hoursPerDay?: number; // <-- Añadir
  }[];
  integrantes?: number[]; // Aún no usados
  coverImageKey?: string; // ya está incluido
  coverVideoKey?: string; // <-- Nuevo campo
  type_project: string;
  categoryId: number;
  isPublic?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  tipoVisualizacion?: 'meses' | 'dias';
  horasPorDia?: number; // NUEVO
  totalHoras?: number; // NUEVO
  tiempoEstimado?: number; // NUEVO
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
      coverImageKey: projectData.coverImageKey ?? null,
      coverVideoKey: projectData.coverVideoKey ?? null, // <-- Nuevo
      type_project: projectData.type_project,
      userId: UserId,
      categoryId: projectData.categoryId,
      isPublic: projectData.isPublic ?? false,
      // Cambia aquí: convierte a ISO si existe, solo la parte de fecha (YYYY-MM-DD)
      fecha_inicio: projectData.fechaInicio
        ? new Date(projectData.fechaInicio).toISOString().split('T')[0]
        : null,
      fecha_fin: projectData.fechaFin
        ? new Date(projectData.fechaFin).toISOString().split('T')[0]
        : null,
      tipo_visualizacion: projectData.tipoVisualizacion ?? 'meses',
      horas_por_dia: projectData.horasPorDia ?? null, // NUEVO
      total_horas: projectData.totalHoras ?? null, // NUEVO
      tiempo_estimado: projectData.tiempoEstimado ?? null, // NUEVO
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: projects.id });

  const projectId = insertedProjects[0]?.id;
  if (!projectId) {
    throw new Error('No se pudo crear el proyecto');
  }

  // 2. Insertar objetivos específicos y guardar el mapeo de ids temporales a ids reales
  let objetivosIdMap: Record<string, number> = {};
  if (
    projectData.objetivos_especificos &&
    projectData.objetivos_especificos.length > 0
  ) {
    // Permitir tanto array de strings como array de objetos {id, title}
    let objetivosArray: { id: string; title: string }[];
    if (typeof projectData.objetivos_especificos[0] === 'string') {
      // Si es array de strings, conviértelo a objetos con id único
      objetivosArray = (
        projectData.objetivos_especificos as unknown as string[]
      ).map((title, idx) => ({
        id: `obj_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        title,
      }));
    } else {
      objetivosArray = projectData.objetivos_especificos as {
        id: string;
        title: string;
      }[];
    }

    const objetivosData = objetivosArray.map((obj) => ({
      projectId,
      description: obj.title,
      createdAt: new Date(),
    }));
    const inserted = await db
      .insert(specificObjectives)
      .values(objetivosData)
      .returning({ id: specificObjectives.id });
    // Mapea id temporal a id real
    objetivosIdMap = Object.fromEntries(
      objetivosArray.map((obj, idx) => [obj.id, inserted[idx].id])
    );
  }

  // 3. Insertar actividades y cronograma
  if (projectData.actividades && projectData.actividades.length > 0) {
    for (const actividad of projectData.actividades) {
      // Buscar el id real del objetivo si viene objetivoId
      let realObjectiveId: number | undefined = undefined;
      if (actividad.objetivoId && objetivosIdMap[actividad.objetivoId]) {
        realObjectiveId = objetivosIdMap[actividad.objetivoId];
      }
      // Insertar actividad con objectiveId
      const [insertedActividad] = await db
        .insert(projectActivities)
        .values({
          projectId,
          objectiveId: realObjectiveId,
          description: actividad.descripcion,
          responsibleUserId: actividad.responsibleUserId ?? null,
          hoursPerDay: actividad.hoursPerDay ?? 1,
        })
        .returning({ id: projectActivities.id });

      const actividadId = insertedActividad?.id;

      // Insertar meses del cronograma
      if (actividadId && actividad.meses.length > 0) {
        const scheduleData = actividad.meses.map((mes: number) => ({
          activityId: actividadId,
          month: mes,
        }));
        await db.insert(projectSchedule).values(scheduleData);
      }
    }
  }

  return { id: projectId };
}
