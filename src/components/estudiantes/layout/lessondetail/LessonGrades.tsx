'use client';
import React from 'react';

import { StarIcon } from '@heroicons/react/24/solid';
import { FaTrophy } from 'react-icons/fa';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { formatScore } from '~/utils/formatScore';

interface LessonGradesProps {
	finalGrade: number | null;
	onViewHistoryAction: () => void; // Renamed to indicate Server Action
	isLoading?: boolean;
}

export function LessonGrades({
	finalGrade,
	onViewHistoryAction, // Updated prop name
	isLoading,
}: LessonGradesProps) {
	// Add useMemo to prevent unnecessary re-renders
	const displayGrade = React.useMemo(() => {
		return finalGrade !== null ? formatScore(finalGrade) : '0.0';
	}, [finalGrade]);

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 ease-in-out">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">Nota Actual</h3>
				<FaTrophy className="text-2xl text-yellow-500" />
			</div>

			<div className="mb-4 flex min-h-[40px] items-center justify-center">
				{isLoading ? (
					<Icons.spinner className="text-background h-6 w-6" />
				) : (
					<div className="flex items-center">
						<StarIcon className="size-8 text-yellow-500" />
						<span
							className={`ml-2 text-3xl font-bold ${
								Number(displayGrade) < 3 ? 'text-red-600' : 'text-green-600'
							}`}
						>
							{displayGrade}
						</span>
					</div>
				)}
			</div>

			<Button
				onClick={onViewHistoryAction} // Updated prop name usage
				className="w-full bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]"
			>
				<FaTrophy className="mr-2" />
				Ver Historial Completo
			</Button>
		</div>
	);
}
