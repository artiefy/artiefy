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

// Remove async since this function doesn't use await directly
export default function Page({ params }: PageProps) {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<Suspense fallback={<ProgramDetailsSkeleton />}>
				<ProgramContent params={params} />
			</Suspense>
			<Footer />
		</div>
	);
}

// Separate the async content into its own component
async function ProgramContent({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const program = await getProgramById(id);

	if (!program) {
		notFound();
	}

	return <ProgramDetails program={program} />;
}
