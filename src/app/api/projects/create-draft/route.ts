import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

interface ProjectDraftData {
  idea: string;
  description?: string;
  objectives?: string[];
  activities?: string[];
  courses?: number[];
}

interface RequestBody {
  projectData: string | ProjectDraftData; // Acepta tanto string como objeto
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { projectData: projectDataRaw }: RequestBody = await req.json();

    // Manejar projectData como string JSON o como objeto
    let projectData: ProjectDraftData;

    if (typeof projectDataRaw === 'string') {
      try {
        projectData = JSON.parse(projectDataRaw) as ProjectDraftData;
      } catch (parseError) {
        console.error('Error parsing projectData JSON:', parseError);
        return NextResponse.json(
          { error: 'projectData debe ser un JSON válido' },
          { status: 400 }
        );
      }
    } else {
      projectData = projectDataRaw;
    }

    if (!projectData?.idea) {
      return NextResponse.json(
        { error: 'Se requiere una idea para el proyecto' },
        { status: 400 }
      );
    }

    // Por ahora solo retornamos confirmación
    // En el futuro se puede guardar en una tabla de drafts
    return NextResponse.json({
      success: true,
      message: 'Borrador de proyecto creado exitosamente',
      data: {
        ...projectData,
        userId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating project draft:', error);
    return NextResponse.json(
      { error: 'Error creando borrador de proyecto' },
      { status: 500 }
    );
  }
}
