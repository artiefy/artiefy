import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { CertificationStudent } from '~/components/estudiantes/layout/certification/CertificationStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
	// Get and validate params and auth in parallel
	const [resolvedParams, { userId }] = await Promise.all([params, auth()]);

	if (!resolvedParams?.id) {
		redirect('/estudiantes/cursos');
	}

	if (!userId) {
		redirect('/sign-in');
	}

	// Now we can safely use the resolved params
	const course = await getCourseById(Number(resolvedParams.id), userId);

	if (!course) {
		notFound();
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
