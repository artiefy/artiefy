import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { StudentCertification } from '~/components/estudiantes/layout/certification/StudentCertification';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';

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

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<Suspense fallback={<div>Cargando certificado...</div>}>
					<StudentCertification course={course} userId={userId} />
				</Suspense>
			</main>
			<Footer />
		</div>
	);
}
