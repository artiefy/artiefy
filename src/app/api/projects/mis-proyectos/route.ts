import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getUserProjects } from '~/server/actions/project/getUserProjects';
import { getUserProjectsTaken } from '~/server/actions/project/getUserProjectsTaken';

export async function GET() {
  try {
    console.log('🔍 API /mis-proyectos called');

    // Obtener el usuario autenticado desde Clerk
    const { userId } = await auth();

    if (!userId) {
      console.log('❌ No userId found in auth');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('👤 Fetching projects for userId:', userId);

    // Obtener proyectos propios
    console.log('📁 Getting own projects...');
    const ownProjects = await getUserProjects(userId);
    console.log('✅ Own projects found:', ownProjects.length);

    // Obtener proyectos tomados
    console.log('📂 Getting taken projects...');
    const takenProjects = await getUserProjectsTaken(userId);
    console.log('✅ Taken projects found:', takenProjects.length);

    // Formatear proyectos propios
    const formattedOwnProjects = ownProjects.map((project) => ({
      ...project, // Esto ya incluye coverVideoKey tal cual está en la BD
      category: project.category?.name ?? 'Sin categoría',
      tags: ['proyecto', 'propio'],
      author: 'Mi proyecto',
      views: 0,
      status: project.isPublic ? 'Publicado' : 'En Desarrollo',
      date: project.createdAt ? new Date(project.createdAt).toISOString() : '',
      title: project.name,
      description: project.planteamiento,
      projectType: 'own' as const,
    }));

    // Formatear proyectos tomados
    const formattedTakenProjects = takenProjects
      .filter((taken) => taken.project?.id)
      .map((taken) => ({
        ...taken.project!, // Esto ya incluye coverVideoKey tal cual está en la BD
        category: taken.project!.category?.name ?? 'Sin categoría',
        tags: ['proyecto', 'tomado'],
        author: 'Otro usuario',
        views: 0,
        status: 'Tomado',
        date: taken.project!.createdAt
          ? new Date(taken.project!.createdAt).toISOString()
          : '',
        title: taken.project!.name,
        description: taken.project!.planteamiento,
        projectType: 'taken' as const,
      }));

    // Combinar ambos tipos de proyectos
    const allProjects = [...formattedOwnProjects, ...formattedTakenProjects];

    console.log('📊 Total projects to return:', allProjects.length);

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('❌ Error al obtener proyectos del usuario:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
