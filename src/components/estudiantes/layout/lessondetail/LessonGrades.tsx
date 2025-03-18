'use client';
import { StarIcon } from '@heroicons/react/24/solid';
import { FaTrophy } from 'react-icons/fa';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { formatScore } from '~/utils/formatScore';

interface LessonGradesProps {
	finalGrade: number | null;
	onViewHistory: () => void;
	isLoading?: boolean;
}

export function LessonGrades({
	finalGrade,
	onViewHistory,
	isLoading,
}: LessonGradesProps) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 ease-in-out">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">Nota Actual</h3>
				<FaTrophy className="text-2xl text-yellow-500" />
			</div>

			<div className="mb-4 flex min-h-[40px] items-center justify-center">
				{isLoading ? (
					<Icons.spinner className="h-6 w-6 animate-spin text-background" />
				) : finalGrade !== null ? (
					<div className="flex items-center">
						<StarIcon className="size-8 text-yellow-500" />
						<span
							className={`ml-2 text-3xl font-bold transition-all duration-200 ${
								finalGrade < 3 ? 'text-red-600' : 'text-green-600'
							}`}
						>
							{formatScore(finalGrade)}
						</span>
					</div>
				) : (
					<span className="text-gray-500">No hay calificaciones</span>
				)}
			</div>

			<Button
				onClick={onViewHistory}
				className="active:scale-[0.98] w-full bg-blue-500 text-white hover:bg-blue-600"
			>
				<FaTrophy className="mr-2" />
				Ver Historial Completo
			</Button>
		</div>
	);
}
