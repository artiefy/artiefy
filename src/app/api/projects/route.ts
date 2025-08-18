import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { createProject } from '~/server/actions/project/createProject';
import { getProjectById } from '~/server/actions/project/getProjectById';
import getPublicProjects from '~/server/actions/project/getPublicProjects';

// Actualizar la interfaz para que coincida completamente con el schema
interface ProjectData {
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  objetivos_especificos?: { id: string; title: string }[]; // <-- Cambia a array de objetos
  actividades?: {
    descripcion: string;
    meses: number[];
    objetivoId?: string;
    responsibleUserId?: string;
    hoursPerDay?: number;
  }[];
  integrantes?: number[];
  coverImageKey?: string;
  type_project: string;
  categoryId: number;
  isPublic?: boolean;
  userId: string;
  fechaInicio?: string;
  fechaFin?: string;
  tipoVisualizacion?: 'meses' | 'dias';
}

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (projectId) {
      const project = await getProjectById(Number(projectId));
      if (!project) return respondWithError('Proyecto no encontrado', 404);
      return NextResponse.json(project);
    } else if (userId) {
      // Implementa getProjectsByUserId si lo necesitas
      // const projects = await getProjectsByUserId(userId);
      // return NextResponse.json(projects);
      return respondWithError('Funcionalidad no implementada', 501);
    } else {
      const projects = await getPublicProjects();
      return NextResponse.json(projects);
    }
  } catch (_error) {
    return respondWithError('Error al obtener proyectos', 500);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('No autorizado: No se encontró userId en Clerk');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let body: Partial<ProjectData> = {};
    let coverImageKey: string | null = null;

    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const proyectoStr = formData.get('proyecto') as string;
      body = JSON.parse(proyectoStr) as Partial<ProjectData>;

      const file = formData.get('imagen') as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `proyecto_${Date.now()}_${file.name}`;
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, buffer);
        coverImageKey = `/uploads/${fileName}`;
      }
    } else {
      body = (await req.json()) as Partial<ProjectData>;
      if (body.coverImageKey) {
        coverImageKey = body.coverImageKey;
      }
    }

    // Validar campos requeridos según el schema
    if (
      !body.name ||
      !body.planteamiento ||
      !body.justificacion ||
      !body.objetivo_general ||
      !body.type_project ||
      !body.categoryId
    ) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos para crear el proyecto' },
        { status: 400 }
      );
    }

    // Procesar objetivos_especificos y actividades de forma segura
    interface SafeSpecificObjective {
      id: string;
      title: string;
      activities?: string[];
    }
    const objetivos_especificos_db: { id: string; title: string }[] = [];
    let actividades_db: {
      descripcion: string;
      meses: number[];
      objetivoId?: string;
      responsibleUserId?: string;
      hoursPerDay?: number;
    }[] = [];

    if (Array.isArray(body.objetivos_especificos)) {
      for (const obj of body.objetivos_especificos as SafeSpecificObjective[]) {
        if (
          obj &&
          typeof obj.title === 'string' &&
          typeof obj.id === 'string'
        ) {
          objetivos_especificos_db.push({ id: obj.id, title: obj.title });
          if (Array.isArray(obj.activities)) {
            obj.activities.forEach((act) => {
              if (typeof act === 'string' && act.trim() !== '') {
                actividades_db.push({
                  descripcion: act,
                  meses: [],
                  objetivoId: obj.id,
                });
              }
            });
          }
        }
      }
    }

    // Si body.actividades viene con responsibleUserId/hoursPerDay, mapea esos datos
    if (Array.isArray(body.actividades)) {
      actividades_db = body.actividades.map((a) => ({
        descripcion: a.descripcion,
        meses: Array.isArray(a.meses) ? a.meses : [],
        objetivoId: a.objetivoId,
        responsibleUserId: a.responsibleUserId,
        hoursPerDay: typeof a.hoursPerDay === 'number' ? a.hoursPerDay : 1,
      }));
    }

    // Preparar datos del proyecto
    const projectData: ProjectData = {
      name: body.name,
      planteamiento: body.planteamiento,
      justificacion: body.justificacion,
      objetivo_general: body.objetivo_general,
      type_project: body.type_project,
      categoryId: body.categoryId,
      userId,
      objetivos_especificos: objetivos_especificos_db,
      actividades: actividades_db,
      integrantes: body.integrantes ?? [],
      coverImageKey: coverImageKey ?? undefined,
      fechaInicio:
        body.fechaInicio && !isNaN(Date.parse(body.fechaInicio))
          ? new Date(body.fechaInicio).toISOString().split('T')[0]
          : undefined,
      fechaFin:
        body.fechaFin && !isNaN(Date.parse(body.fechaFin))
          ? new Date(body.fechaFin).toISOString().split('T')[0]
          : undefined,
      tipoVisualizacion: body.tipoVisualizacion ?? 'meses',
      isPublic: body.isPublic ?? false,
    };

    console.log(
      'Datos finales del proyecto a crear:',
      JSON.stringify(projectData, null, 2)
    );

    const result = await createProject(projectData);

    return NextResponse.json({
      message: 'Proyecto creado correctamente',
      id: result?.id,
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return NextResponse.json(
      { error: 'Error al crear el proyecto' },
      { status: 500 }
    );
  }
}
