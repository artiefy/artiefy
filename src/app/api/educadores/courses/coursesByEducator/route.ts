import { type NextRequest, NextResponse } from 'next/server';



import {
	getAllCourses,
	getCourseById,
	getCoursesByUser,
	getTotalStudents,
	getLessonsByCourseId,
	getTotalDuration,
} from '~/models/educatorsModels/courseModelsEducator';
import { getSubjects } from '~/models/educatorsModels/subjectModels'; // Import the function to get subjects

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// GET endpoint para obtener un curso por su ID
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const courseId = searchParams.get('courseId');
	const userId = searchParams.get('fullName'); // Changed from userId to use fullName
	const fullName = searchParams.get('fullName');
	const fetchSubjects = searchParams.get('fetchSubjects');
	

	console.log('GET Request Parameters:', {
		courseId,
		userId: fullName, // Log the fullName as userId
		fullName,
		fetchSubjects,
	});

	try {
		if (fetchSubjects) {
			const subjects = await getSubjects();
			console.log('Subjects:', subjects);
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
				instructor: fullName, // Add the instructor name from Clerk
			};
		} else if (userId) {
			// This now uses the fullName value
			courses = await getCoursesByUser(userId);
			// Add the instructor name to each course
			courses = courses.map((course) => ({
				...course,
				instructor: fullName,
				userId: fullName, // Add this line to ensure userId is also the fullName
			}));
			console.log('Courses for instructor:', fullName, courses);
		} else {
			courses = await getAllCourses();
			console.log('All courses:', courses);
		}
		return NextResponse.json(courses);
	} catch (error) {
		console.error('Error in GET courses:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los datos' },
			{ status: 500 }
		);
	}
}
