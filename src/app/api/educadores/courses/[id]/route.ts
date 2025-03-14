import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';

import {
<<<<<<< HEAD
	createCourse,
	deleteCourse,
	getAllCourses,
	getCourseById,
	getCoursesByUserId,
	updateCourse,
=======
  getAllCourses,
  createCourse,
  deleteCourse,
  getCourseById,
  updateCourse,
>>>>>>> 106ed634249738e068cde72c88c34ba752c1728a
} from '~/models/educatorsModels/courseModelsEducator';
import { ratelimit } from '~/server/ratelimit/ratelimit';

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// GET endpoint para obtener cursos
export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get('userId');

	try {
		let courses;
		if (userId) {
			courses = await getCoursesByUserId(userId);
		} else {
			courses = await getAllCourses();
		}
		return NextResponse.json(courses);
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los cursos' },
			{ status: 500 }
		);
	}
}

// POST endpoint para crear cursos
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		// Implement rate limiting
		const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
		const { success } = await ratelimit.limit(ip);
		if (!success) {
			return respondWithError('Demasiadas solicitudes', 429);
		}

		const clerkUser = await currentUser();
		if (!clerkUser) {
			return respondWithError(
				'No se pudo obtener información del usuario',
				500
			);
		}

		const body = (await request.json()) as {
			title: string;
			description: string;
			coverImageKey: string;
			categoryid: number;
			modalidadesid: number;
			dificultadid: number;
			instructor: string;
			requerimientos: string;
		};

		const {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			dificultadid,
			instructor,
			requerimientos,
		} = body;

		await createCourse({
			title,
			description,
			creatorId: userId,
			coverImageKey,
			categoryid,
			modalidadesid,
			dificultadid,
			instructor,
			requerimientos,
		});

		console.log('Datos enviados al servidor:', {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			dificultadid,
			instructor,
			requerimientos,
		});

		return NextResponse.json({ message: 'Curso creado exitosamente' });
	} catch (error: unknown) {
		console.error('Error al crear el curso:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return respondWithError(`Error al crear el curso: ${errorMessage}`, 500);
	}
}

// Actualizar un curso
export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const body = (await request.json()) as {
			id: number;
			title: string;
			description: string;
			coverImageKey: string;
			categoryid: number;
			modalidadesid: number;
			dificultadid: number;
			instructor: string;
			requerimientos: string;
		};
		const {
			id,
			title,
			description,
			coverImageKey,
			modalidadesid,
			dificultadid,
			categoryid,
			instructor,
			requerimientos,
		} = body;

		const course = await getCourseById(id);
		if (!course) {
			return respondWithError('Curso no encontrado', 404);
		}

		if (course.creatorId !== userId) {
			return respondWithError('No autorizado para actualizar este curso', 403);
		}

		await updateCourse(id, {
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			instructor,
			dificultadid,
			requerimientos,
		});

		return NextResponse.json({ message: 'Curso actualizado exitosamente' });
	} catch (error) {
		console.error('Error al actualizar el curso:', error);
		return respondWithError('Error al actualizar el curso', 500);
	}
}

// Eliminar un curso
export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json(
				{ error: 'ID no proporcionado' },
				{ status: 400 }
			);
		}

		const parsedCourseId = parseInt(courseId);
		await deleteCourse(parsedCourseId);
		return NextResponse.json({ message: 'Curso eliminado exitosamente' });
	} catch (error) {
		console.error('Error al eliminar el curso:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar el curso' },
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
  dificultadid: number;
  instructor: string;
  requerimientos: string;
  creatorId: string;
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

interface DeleteCourseRequest {
  id: string;
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verifica si hay cuerpo en la solicitud
    if (request.body === undefined || request.body === null) {
      return NextResponse.json({ error: 'Cuerpo vacío' }, { status: 400 });
    }

    // Convertimos el JSON recibido al tipo correcto
    let data: DeleteCourseRequest;
    try {
      data = (await request.json()) as DeleteCourseRequest;
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    // Validamos que el ID sea un string válido
    if (!data.id || typeof data.id !== 'string') {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const courseId = parseInt(data.id);
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
  
