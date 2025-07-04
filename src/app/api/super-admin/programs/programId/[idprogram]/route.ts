
import { and,eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	categories,
	courses,
	enrollmentPrograms,
	materias,
	programas,
} from '~/server/db/schema';

import type { Program } from '~/types';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	console.log('Request method:', req.method); // Debugging log
	if (req.method === 'GET') {
		const { idprogram } = req.query;
		if (!idprogram) {
			return res.status(400).json({ message: 'Program ID is required' });
		}

		console.log('Fetching program by ID:', idprogram); // Debugging log
		const program = await getProgramById(idprogram as string);
		if (program) {
			res.status(200).json(program);
		} else {
			res.status(404).json({ message: 'Program not found' });
		}
	} else if (req.method === 'POST' && req.url?.includes('isUserEnrolled')) {
		const { programId, userId } = req.body as {
			programId: number;
			userId: string;
		};
		console.log('Checking if user is enrolled:', { programId, userId }); // Debugging log
		const isEnrolled = await isUserEnrolledInProgram(programId, userId);
		return res.status(200).json({ enrolled: isEnrolled });
	} else {
		res.setHeader('Allow', ['GET', 'POST']);
		return res
			.status(405)
			.json({ message: `Method ${req.method} not allowed` });
	}
}

export const getProgramById = async (id: string): Promise<Program | null> => {
    try {
        console.log('Querying program by ID:', id);
        // Get program basic data
        const program = await db.query.programas.findFirst({
            where: eq(programas.id, parseInt(id, 10)),
        });

        if (!program) {
            return null;
        }

        // Get materias with their courses and categories in a single query
        const materiasWithCourses = await db
            .select()
            .from(materias)
            .leftJoin(courses, eq(materias.courseid, courses.id))
            .leftJoin(categories, eq(courses.categoryid, categories.id))
            .where(eq(materias.programaId, program.id));

        // Get enrollment count
        const enrollmentCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(enrollmentPrograms)
            .where(eq(enrollmentPrograms.programaId, parseInt(id, 10)))
            .then((result) => Number(result[0]?.count ?? 0));

        // Transform the results including category information
        const transformedMaterias = materiasWithCourses
            .map(({ materias, courses, categories }) => ({
                id: materias.id,
                title: materias.title,
                description: materias.description,
                programaId: materias.programaId ?? 0,
                courseid: materias.courseid,
                curso: courses
                    ? {
                            ...courses,
                            totalStudents: enrollmentCount,
                            lessons: [],
                            requerimientos: [],
                            category: categories
                                ? {
                                        id: categories.id,
                                        name: categories.name,
                                        description: categories.description,
                                        is_featured: categories.is_featured,
                                    }
                                : undefined,
                        }
                    : undefined,
            }))
            .filter((materia) => materia.curso);

        // Build final program object
        return {
            id: program.id.toString(),
            title: program.title,
            description: program.description,
            coverImageKey: program.coverImageKey,
            createdAt: program.createdAt ? new Date(program.createdAt) : null,
            updatedAt: program.updatedAt ? new Date(program.updatedAt) : null,
            creatorId: program.creatorId,
            rating: program.rating,
            categoryid: program.categoryid,
            materias: transformedMaterias,
        };
    } catch (error) {
        console.error('Error fetching program:', error);
        return null;
    }
};

export async function isUserEnrolledInProgram(
	programId: number,
	userId: string
): Promise<boolean> {
	try {
		console.log('Querying enrollment for user:', { programId, userId }); // Debugging log
		const existingEnrollment = await db.query.enrollmentPrograms.findFirst({
			where: and(
				eq(enrollmentPrograms.userId, userId),
				eq(enrollmentPrograms.programaId, programId)
			),
		});
		return !!existingEnrollment;
	} catch (error) {
		console.error('Error checking program enrollment:', error);
		throw new Error('Failed to check program enrollment status');
	}
}
