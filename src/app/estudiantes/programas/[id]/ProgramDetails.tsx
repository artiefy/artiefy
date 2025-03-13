'use client';

import { useState } from 'react';

import { ProgramHeader } from '~/components/estudiantes/layout/programs/ProgramHeader';

import type { Program } from '~/types';

interface ProgramDetailsProps {
	program: Program;
}

export default function ProgramDetails({
	program: initialProgram,
}: ProgramDetailsProps) {
	const [program] = useState(initialProgram);
	const totalStudents = program.enrollmentPrograms?.length ?? 0;

	return (
		<div className="min-h-screen bg-background">
			<main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
				<ProgramHeader program={program} totalStudents={totalStudents} />
			</main>
		</div>
	);
}
