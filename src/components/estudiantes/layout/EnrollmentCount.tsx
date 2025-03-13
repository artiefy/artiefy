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
		<div className="flex items-center gap-2 rounded-md bg-violet-500/10 px-2 py-1">
			<span className="font-semibold text-violet-500">{count}</span>
			<Users className="size-4 text-violet-500" />
			<span className="text-sm font-medium text-violet-500">estudiantes</span>
		</div>
	);
}
