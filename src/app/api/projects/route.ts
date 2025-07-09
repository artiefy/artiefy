import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { createProject } from '~/server/actions/project/createProject';
import { getProjectById } from '~/server/actions/project/getProjectById';
import getPublicProjects from '~/server/actions/project/getPublicProjects';

// Define el tipo ProjectData igual que en createProject.ts para tipado seguro
interface ProjectData {
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  objetivos_especificos?: string[];
  actividades?: {
    descripcion: string;
    meses: number[];
  }[];
  integrantes?: number[];
  coverImageKey?: string;
  type_project: string;
  categoryId: number;
  isPublic?: boolean;
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
    // Asegúrate de que Clerk esté correctamente configurado y el token de autenticación se envíe en la petición.
    // Si usas fetch desde el frontend, asegúrate de enviar las cookies de sesión o el header Authorization.
    const { userId } = await auth();
    if (!userId) {
      // Puedes agregar más logging para depurar problemas de autenticación
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
        // Asegura que la carpeta exista antes de guardar el archivo
        await mkdir(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, buffer);
        coverImageKey = `/uploads/${fileName}`;
      }
    } else {
      body = (await req.json()) as Partial<ProjectData>;
      // Si el body ya trae coverImageKey, úsalo
      if (body.coverImageKey) {
        coverImageKey = body.coverImageKey;
      }
    }

    const result = await createProject({
      ...body,
      // @ts-expect-error: userId no está en ProjectData pero el backend lo requiere
      userId,
      coverImageKey: coverImageKey ?? undefined,
    });

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