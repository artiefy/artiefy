import { type NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { materiaGrades, materias } from '~/server/db/schema';

interface MateriaWithGrade {
	id: number;
	title: string;
	grade: number;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');
		const courseId = searchParams.get('courseId');

		console.log('Received request with:', { userId, courseId }); // Debug log

		if (!userId || !courseId) {
			return NextResponse.json(
				{ error: 'Missing required parameters' },
				{ status: 400 }
			);
		}

		// Get all materias grades for the course
		const materiasGrades = await db
			.select({
				materiaId: materiaGrades.materiaId,
				grade: materiaGrades.grade,
			})
			.from(materiaGrades)
			.where(eq(materiaGrades.userId, userId));

		console.log('Found grades:', materiasGrades); // Debug log

		const courseMaterias = await db.query.materias.findMany({
			where: eq(materias.courseid, parseInt(courseId)),
		});

		console.log('Found materias:', courseMaterias); // Debug log

		// Map results with proper grade lookup and format grades to 2 decimal places
		const formattedResults: MateriaWithGrade[] = courseMaterias.map(
			(materia) => {
				const gradeRecord = materiasGrades.find(
					(g) => g.materiaId === materia.id
				);
				return {
					id: materia.id,
					title: materia.title,
					grade: Number((gradeRecord?.grade ?? 0).toFixed(2)), // Format number to 2 decimal places
				};
			}
		);

		console.log('Final formatted results:', formattedResults); // Debug log

		return NextResponse.json({ materias: formattedResults });
	} catch (error) {
		console.error('Error fetching materia grades:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch grades' },
			{ status: 500 }
		);
	}
}
