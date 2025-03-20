import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
	createCourse,
	deleteCourse,
	getAllCourses,
	getCourseById,
	getCoursesByUserId,
	updateCourse,
	getTotalStudents,
	getLessonsByCourseId,
	getTotalDuration,
	updateMateria,
} from '~/models/educatorsModels/courseModelsEducator';
import { getSubjects } from '~/models/educatorsModels/subjectModels'; // Import the function to get subjects
import { getModalidadById } from '~/models/super-adminModels/courseModelsSuperAdmin';

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });


// GET endpoint para obtener un curso por su ID
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const courseId = searchParams.get('courseId');
	const userId = searchParams.get('userId');
	const fetchSubjects = searchParams.get('fetchSubjects'); // Check if fetchSubjects is requested
	console.log('CourseId en api route', courseId);
	console.log('FetchSubjects:', fetchSubjects); // Add console log to debug

	try {
		if (fetchSubjects) {
			const subjects = await getSubjects();
			console.log('Fetched subjects from DB:', subjects); // Add console log to debug
			return NextResponse.json(subjects);
		}
		let courses;
		if (courseId) {
			const course = await getCourseById(parseInt(courseId));
			const totalStudents = await getTotalStudents(parseInt(courseId));
			const lessons = await getLessonsByCourseId(parseInt(courseId));
			const totalDuration = await getTotalDuration(parseInt(courseId));

			if (!course) {
				return respondWithError('Curso no encontrado', 404);
			}
			courses = {
				...course,
				totalStudents,
				totalDuration,
				lessons,
			};
		} else if (userId) {
			courses = await getCoursesByUserId(userId);
		} else {
			courses = await getAllCourses();
		}
		console.log('Courses en api route', courses);
		return NextResponse.json(courses);
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los datos' },
			{ status: 500 }
		);
	}
}


export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			console.log('Usuario no autorizado');
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		// Parsear los datos del cuerpo de la solicitud
		const data = (await request.json()) as {
			title: string;
			description: string;
			coverImageKey: string;
			categoryid: number;
			modalidadesid: number[];
			nivelid: number;
			rating: number;
			instructor: string;
			subjects?: { id: number }[];
			courseTypeId: number; // 👉 agregar este campo
			isActive: boolean;
		};
		console.log('Received data:', data);

		console.log('Datos recibidos en el backend:', data);

		const createdCourses = [];
		const isMultipleModalities = data.modalidadesid.length > 1;
		// Iterar sobre cada modalidadId y crear un curso
		for (const modalidadId of data.modalidadesid) {
			const modalidad = await getModalidadById(modalidadId);

			console.log(`Procesando modalidadId: ${modalidadId}`);

			// Construir el título del curso con el nombre de la modalidad
			const newTitle =
				modalidad && isMultipleModalities
					? `${data.title} - ${modalidad.name}`
					: data.title;
			const newCourse = await createCourse({
				title: newTitle,
				description: data.description,
				creatorId: userId,
				coverImageKey: data.coverImageKey,
				categoryid: data.categoryid,
				rating: data.rating,
				modalidadesid: modalidadId,
				nivelid: data.nivelid,
				instructor: data.instructor,
				courseTypeId: data.courseTypeId,isActive: data.isActive 
			});

			console.log('Curso creado:', newCourse);

			// Actualizar las materias con el ID del curso recién creado
			// Actualizar las materias con el ID del curso recién creado
			if (
				data.subjects &&
				Array.isArray(data.subjects) &&
				data.subjects.length > 0
			) {
				console.log('Actualizando materias:', data.subjects);
				await Promise.all(
					data.subjects.map(async (subject) => {
						await updateMateria(subject.id, {
							courseid: newCourse.id,
						});
						console.log(
							`Materia actualizada: ${subject.id} -> courseId: ${newCourse.id}`
						);
					})
				);
			} else {
				console.log('No se proporcionaron materias para actualizar.');
			}

			createdCourses.push(newCourse);
		}

		console.log('Cursos creados:', createdCourses);

		return NextResponse.json(createdCourses, { status: 201 });
	} catch (error) {
		console.error('Error al crear el curso:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return NextResponse.json(
			{ error: `Error al crear el curso: ${errorMessage}` },
			{ status: 500 }
		);
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
			nivelid: number;
			instructor: string;
			subjects: { id: number; courseId: number | null }[]; // ✅ Solo actualizar `courseId`
		};
		const {
			id,
			title,
			description,
			coverImageKey,
			modalidadesid,
			nivelid,
			categoryid,
			instructor,
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
			nivelid,
		});

		// ✅ Actualizar las materias asignadas a este curso
		await Promise.all(
			body.subjects.map(async (subject) => {
				await updateMateria(subject.id, {
					courseid: id, // ✅ Asigna el nuevo ID del curso a la materia
				});
			})
		);

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
