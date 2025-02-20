import { NextResponse } from 'next/server';
import { getCoursesByUserIdSimplified } from '~/models/super-adminModels/courseModelsSuperAdmin';

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');

		if (!userId) {
			return NextResponse.json(
				{ error: 'Falta el ID del usuario' },
				{ status: 400 }
			);
		}

		// Obtener los cursos del usuario
		const courses = await getCoursesByUserIdSimplified(userId);

		// Log para ver qué cursos estamos obteniendo
		console.log('Cursos obtenidos:', courses);

		if (!courses || courses.length === 0) {
			return NextResponse.json({ courses: [] }, { status: 200 });
		}

		// Filtrar solo título e imagen
		const filteredCourses = courses.map((course) => ({
			id: course.id,
			title: course.title,
			coverImage: course.coverImageKey
				? `/path/to/images/${course.coverImageKey}` // Si `coverImageKey` tiene una ruta completa o clave, lo muestra
				: '/default-course-image.png', // Si no, muestra una imagen predeterminada
		}));

		// Log para ver los cursos filtrados antes de devolverlos
		console.log('Cursos filtrados:', filteredCourses);

		return NextResponse.json({ courses: filteredCourses }, { status: 200 });
	} catch (error) {
		console.error('Error al obtener los cursos del usuario:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
