import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { ProgramDetailsSkeleton } from '~/components/estudiantes/layout/programdetail/ProgramDetailsSkeleton';
import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';

import ProgramDetails from './ProgramDetails';

interface Props {
	params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
	const { id } = await params;

	return (
		<div>
			<Header />
			<Suspense fallback={<ProgramDetailsSkeleton />}>
				<ProgramContent id={id} />
			</Suspense>
			<Footer />
		</div>
	);
}

async function ProgramContent({ id }: { id: string }) {
	const program = await getProgramById(id);

	if (!program) {
		notFound();
	}

	return (
		<section>
			<ProgramDetails program={program} />
		</section>
	);
}
