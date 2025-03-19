import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { CertificationStudent } from '~/components/estudiantes/layout/certification/CertificationStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { db } from '~/server/db';
import { materiaGrades } from '~/server/db/schema';

export default async function CertificatePage({
	params,
}: {
	params: { id: string };
}) {
	const { userId } = await auth();
	const course = await getCourseById(Number(params.id), userId);

	if (!course) {
		notFound();
	}

	// Verificar si todas las clases están completas
	const allLessonsCompleted = course.lessons?.every(
		(lesson) => lesson.porcentajecompletado === 100
	);

	// Obtener promedio de materias
	const grades = await db.query.materiaGrades.findMany({
		where: eq(materiaGrades.userId, userId!),
	});

	const averageGrade =
		grades.length > 0
			? grades.reduce((acc: number, grade) => acc + grade.grade, 0) /
				grades.length
			: 0;

	// Redirigir si no cumple los requisitos
	if (!allLessonsCompleted || averageGrade < 3) {
		redirect('/estudiantes/cursos/' + params.id);
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<Suspense fallback={<div>Cargando certificado...</div>}>
					<CertificationStudent course={course} userId={userId} />
				</Suspense>
			</main>
			<Footer />
		</div>
	);
}
