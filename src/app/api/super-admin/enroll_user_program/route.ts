import { NextResponse } from 'next/server';

import { and, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	users,
	courses,
	enrollments,
	enrollmentPrograms,
	programas,
} from '~/server/db/schema';

export async function GET(req: Request) {
	console.log('⏳ Iniciando GET de enrolled_user_program');
	void req;

	try {
		// 1. Subquery para última fecha de inscripción por usuario
		const latestDates = db
			.select({
				userId: enrollmentPrograms.userId,
				latestEnrolledAt: sql`MAX(${enrollmentPrograms.enrolledAt})`.as(
					'latestEnrolledAt'
				),
			})
			.from(enrollmentPrograms)
			.groupBy(enrollmentPrograms.userId)
			.as('latest_dates');

		console.log('✅ Subquery latestDates construida');

		// 2. Subquery que trae userId y programaId para la última inscripción
		const latestEnrollments = db
			.select({
				userId: enrollmentPrograms.userId,
				programaId: enrollmentPrograms.programaId,
			})
			.from(enrollmentPrograms)
			.innerJoin(
				latestDates,
				and(
					eq(enrollmentPrograms.userId, latestDates.userId),
					eq(enrollmentPrograms.enrolledAt, latestDates.latestEnrolledAt)
				)
			)
			.as('latest_enrollments');

		console.log('✅ Subquery latestEnrollments construida');

		// 3. Traer solo los usuarios inscritos en algún programa (INNER JOIN)
		const students = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				subscriptionStatus: users.subscriptionStatus,
				subscriptionEndDate: users.subscriptionEndDate,
				role: users.role,
				planType: users.planType,
				programTitle: programas.title,
			})
			.from(users)
			.innerJoin(latestEnrollments, eq(users.id, latestEnrollments.userId)) // solo inscritos
			.innerJoin(programas, eq(latestEnrollments.programaId, programas.id)) // y con programa válido
			.where(eq(users.role, 'estudiante'));

		console.log(`🎓 Estudiantes inscritos encontrados: ${students.length}`);
		if (students.length > 0) {
			console.log('🧪 Ejemplo estudiante:', students[0]);
		} else {
			console.log('⚠️ Ningún estudiante inscrito encontrado.');
		}

		// 4. Cursos disponibles
		const coursesList = await db
			.select({
				id: courses.id,
				title: courses.title,
			})
			.from(courses);

		console.log(`📚 Cursos disponibles: ${coursesList.length}`);

		// 5. EnrolledUsers (usado en frontend)
		const enrolledUsers = students.map((s) => ({
			id: s.id,
			programTitle: s.programTitle!,
		}));

		console.log(`📦 enrolledUsers listos: ${enrolledUsers.length}`);

		return NextResponse.json({
			students,
			enrolledUsers,
			courses: coursesList,
		});
	} catch (error) {
		console.error('❌ Error en GET enrolled_user_program:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

interface EnrollmentData {
	courseId: number;
	userId: string;
	programId: number;
}

type EnrollmentRequestBody = {
	userIds: string[];
	courseIds: string[];
};

export async function POST(req: Request) {
	try {
		const { userIds, courseIds }: EnrollmentRequestBody = await req.json();

		if (!userIds || !courseIds) {
			return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
		}

		const insertData: { userId: string; courseId: number }[] = [];

		for (const userId of userIds) {
			for (const courseId of courseIds) {
				const existingEnrollment = await db
					.select()
					.from(enrollments)
					.where(
						and(
							eq(enrollments.userId, userId),
							eq(enrollments.courseId, parseInt(courseId, 10))
						)
					)
					.limit(1);

				if (existingEnrollment.length === 0) {
					insertData.push({ userId, courseId: Number(courseId) });
				}
			}
		}

		if (insertData.length > 0) {
			await db.insert(enrollments).values(insertData);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error al matricular estudiantes:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
