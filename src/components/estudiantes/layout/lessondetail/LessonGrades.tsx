'use client';
import { StarIcon } from '@heroicons/react/24/solid';
import { FaTrophy } from 'react-icons/fa';

import { Button } from '~/components/estudiantes/ui/button';

interface LessonGradesProps {
	finalGrade: number;
	onViewHistory: () => void;
}

export function LessonGrades({ finalGrade, onViewHistory }: LessonGradesProps) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">
					Nota Actual del Curso
				</h3>
				<FaTrophy className="text-2xl text-yellow-500" />
			</div>

			<div className="mb-4 flex items-center justify-center">
				<StarIcon className="h-6 w-6 text-yellow-500" />
				<span className="ml-2 text-2xl font-bold text-primary">
					{finalGrade.toFixed(1)}
				</span>
			</div>

			<Button
				onClick={onViewHistory}
				className="w-full bg-blue-500 text-white hover:bg-blue-600"
			>
				<FaTrophy className="mr-2" />
				Ver Historial Completo
			</Button>
		</div>
	);
}
