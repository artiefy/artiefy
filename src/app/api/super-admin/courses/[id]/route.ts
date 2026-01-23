import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
} from '~/models/super-adminModels/courseModelsSuperAdmin';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } } // ❌ No es una promesa, accede directamente
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const courseId = parseInt(params.id); // ✅ Accede directamente a `params.id`
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const course = await getCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    return NextResponse.json(
      { error: 'Error al obtener el curso' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { params } = context;
    if (!params?.id) {
      return NextResponse.json(
        { error: 'ID de curso no proporcionado' },
        { status: 400 }
      );
    }

    const courseId = Number(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const data = (await request.json()) as CourseData;

    console.log('🟪 API ROUTE PUT INICIADO');
    console.log('courseId:', courseId);
    console.log('data.scheduleOptionId:', data.scheduleOptionId);
    console.log('data.spaceOptionId:', data.spaceOptionId);
    console.log('data.certificationTypeId:', data.certificationTypeId);

    // 🛠 Asegurar que `coverImageKey` existe antes de enviar a la BD
    if (!data.coverImageKey) {
      console.error('❌ Error: `coverImageKey` está vacío o no se envió');
      return NextResponse.json(
        { error: '❌ Error al actualizar la imagen en la BD' },
        { status: 500 }
      );
    }

    console.log('📦 Llamando updateCourse con:', {
      scheduleOptionId: data.scheduleOptionId ?? null,
      spaceOptionId: data.spaceOptionId ?? null,
      certificationTypeId: data.certificationTypeId ?? null,
    });

    const updatedCourse = await getCourseById(courseId);
    console.log('✅ Curso obtenido post-update:', {
      scheduleOptionId: updatedCourse?.scheduleOptionId,
      spaceOptionId: updatedCourse?.spaceOptionId,
      certificationTypeId: updatedCourse?.certificationTypeId,
    });
    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    console.error('❌ Error en el backend al actualizar el curso:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el curso' },
      { status: 500 }
    );
  }
}

export async function GET_ALL() {
  try {
    const courses = await getAllCourses();
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos' },
      { status: 500 }
    );
  }
}

interface CourseData {
  title: string;
  description: string;
  coverImageKey: string;
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
  instructors: string[]; // Array de IDs de instructores (many-to-many)
  creatorId: string;
  scheduleOptionId?: number | null;
  spaceOptionId?: number | null;
  certificationTypeId?: number | null;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data = (await request.json()) as CourseData;

    // Opcional: Validar que los datos tienen la forma esperada
    if (!data.title || !data.description) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const newCourse = await createCourse(data);
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error al crear el curso:', error);
    return NextResponse.json(
      { error: 'Error al crear el curso' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } } // ✅ Obtén el ID desde params
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    await deleteCourse(courseId);
    return NextResponse.json(
      { message: 'Curso eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar el curso:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el curso' },
      { status: 500 }
    );
  }
}
