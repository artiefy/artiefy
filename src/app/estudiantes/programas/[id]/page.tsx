import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { ProgramDetailsSkeleton } from '~/components/estudiantes/layout/programdetail/ProgramDetailsSkeleton';
import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';

import ProgramDetails from './ProgramDetails';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
	// Await the params object
	const { id } = await params;
	const program = await getProgramById(id);

	if (!program) {
		notFound();
	}

	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<Suspense fallback={<ProgramDetailsSkeleton />}>
				<ProgramDetails program={program} />
			</Suspense>
			<Footer />
		</div>
	);
}
