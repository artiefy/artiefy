import { eq } from 'drizzle-orm';
import { db } from '../src/server/db';
import {
  guidedProjects,
  guidedProjectInstructors,
  guidedObjectives,
  guidedObjectiveActivities,
  users,
  categories,
  modalidades,
  nivel,
  typesCourses,
} from '../src/server/db/schema';

async function seed() {
  console.log('🌱 Sembrando ejemplo de Proyecto Guiado...');

  try {
    // 0. Obtener datos necesarios de la DB
    const firstUser = await db.select().from(users).limit(1);
    const firstInstructor = await db
      .select()
      .from(users)
      .where(eq(users.role, 'educador'))
      .limit(1);
    const firstSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, 'super-admin'))
      .limit(1);
    const firstCategory = await db.select().from(categories).limit(1);
    const firstModalidad = await db.select().from(modalidades).limit(1);
    const firstNivel = await db.select().from(nivel).limit(1);

    if (
      !firstUser[0] ||
      !firstCategory[0] ||
      !firstModalidad[0] ||
      !firstNivel[0]
    ) {
      throw new Error(
        'Faltan datos base en la DB (user, category, modalidad o nivel)'
      );
    }

    const creatorId = firstUser[0].id;
    const instructorId =
      firstInstructor[0]?.id ?? firstSuperAdmin[0]?.id ?? creatorId;
    const categoryId = firstCategory[0].id;
    const modalidadId = firstModalidad[0].id;
    const nivelId = firstNivel[0].id;

    console.log(
      `ℹ️ Usando Creator: ${creatorId}, Instructor: ${instructorId}, Category: ${categoryId}, Modalidad: ${modalidadId}, Nivel: ${nivelId}`
    );

    // Asegurar que existe el tipo "PROYECTO GUIADO" con ID 3
    const typeGuided = await db
      .select()
      .from(typesCourses)
      .where(eq(typesCourses.id, 3))
      .limit(1);
    if (!typeGuided[0]) {
      console.log('📝 Creando tipo "PROYECTO GUIADO" con ID 3...');
      await db
        .insert(typesCourses)
        .values({
          id: 3,
          type: 'PROYECTO GUIADO',
        })
        .onConflictDoNothing();
    }

    // 1. Crear el Proyecto
    const [project] = await db
      .insert(guidedProjects)
      .values({
        title: 'Desarrollo de App con IA y Next.js',
        description:
          'Un proyecto paso a paso para construir una aplicación moderna utilizando modelos de lenguaje y el App Router.',
        instructor: instructorId,
        categoryId: categoryId,
        creatorId: creatorId,
        modalidadId: modalidadId,
        nivelId: nivelId,
        typeCourseId: 3, // 👈 PROYECTO GUIADO
        isActive: true,
        visibility: true,
      })
      .returning();

    if (!project) throw new Error('No se pudo crear el proyecto');

    console.log(`✅ Proyecto creado: ${project.title} (ID: ${project.id})`);

    await db
      .insert(guidedProjectInstructors)
      .values({
        guidedProjectId: project.id,
        instructorId,
      })
      .onConflictDoNothing();

    // 2. Crear un Objetivo / Sesión (Habilitado)
    const [objective1] = await db
      .insert(guidedObjectives)
      .values({
        title: 'Semana 1: Fundamentos y Configuración',
        description: 'Preparando el entorno y entendiendo la arquitectura.',
        duration: 60,
        orderIndex: 0,
        guidedProjectId: project.id,
        isEnabled: true,
      })
      .returning();

    // 3. Crear actividades para el Objetivo 1
    await db.insert(guidedObjectiveActivities).values([
      {
        name: 'Clase 1: Configuración de Drizzle y Postgres',
        description: 'Instalación y primera migración.',
        typeId: 1, // Asumimos que el ID 1 existe en type_acti
        objectiveId: objective1.id,
        weekNumber: 1,
        startDate: '2026-06-01',
        endDate: '2026-06-07',
      },
      {
        name: 'Clase 2: Integración con OpenAI SDK',
        description: 'Primeros pasos con la API de IA.',
        typeId: 1,
        objectiveId: objective1.id,
        weekNumber: 1,
        startDate: '2026-06-03',
        endDate: '2026-06-07',
      },
    ]);

    // 4. Crear un Objetivo / Sesión (Deshabilitado / Próximamente)
    const [objective2] = await db
      .insert(guidedObjectives)
      .values({
        title: 'Semana 2: Frontend Avanzado',
        description: 'Diseño de UI elegante con Tailwind V4.',
        duration: 90,
        orderIndex: 1,
        guidedProjectId: project.id,
        isEnabled: false, // 👈 Se verá con candado
      })
      .returning();

    await db.insert(guidedObjectiveActivities).values([
      {
        name: 'Clase 3: Framer Motion y Animaciones',
        description: 'Dando vida a la interfaz.',
        typeId: 1,
        objectiveId: objective2.id,
        weekNumber: 2,
        startDate: '2026-06-08',
        endDate: '2026-06-14',
      },
    ]);

    console.log('✅ Ejemplo completado con éxito.');
  } catch (error) {
    console.error('❌ Error al sembrar datos:', error);
  } finally {
    process.exit();
  }
}

seed();
