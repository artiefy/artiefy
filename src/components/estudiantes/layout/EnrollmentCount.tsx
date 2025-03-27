'use client';

import { useEffect, useState } from 'react';

import { Users } from 'lucide-react';

import { getProgramEnrollmentCount } from '~/server/actions/estudiantes/programs/getProgramEnrollmentCount';

export function EnrollmentCount({ programId }: { programId: number }) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const fetchCount = async () => {
			const enrollmentCount = await getProgramEnrollmentCount(programId);
			setCount(enrollmentCount);
		};

		void fetchCount();
	}, [programId]);
	return (
		<div className="inline-flex items-center gap-2 rounded-md bg-violet-500/10 px-2 py-1">
			<span className="text-base font-semibold text-violet-500 sm:text-sm">
				{count}
			</span>
			<Users className="size-5 text-violet-500 sm:size-4" />
			<span className="text-base font-medium text-violet-500 sm:text-sm">
				Estudiantes
			</span>
		</div>
	);
}
