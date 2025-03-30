import { StarIcon } from '@heroicons/react/24/solid';
import { FaTrophy } from 'react-icons/fa';
import { ImHappy } from 'react-icons/im';
import { PiSmileySad } from 'react-icons/pi';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { formatScore } from '~/utils/formatScore';

interface GradeHistoryProps {
	isOpen: boolean;
	onClose: () => void;
	gradeSummary: {
		finalGrade: number;
		courseCompleted?: boolean;
		parameters: {
			name: string;
			grade: number;
			weight: number;
			activities: {
				id: number;
				name: string;
				grade: number;
				percentage: number;
			}[];
		}[];
	} | null;
}

export function GradeHistory({
	isOpen,
	onClose,
	gradeSummary,
}: GradeHistoryProps) {
	if (!gradeSummary) return null;

	const calculateContribution = (grade: number, weight: number) => {
		return Number(((grade * weight) / 100).toFixed(2));
	};

	// Ordenar los parámetros por nombre (asumiendo que los nombres son "Parámetro 1", "Parámetro 2", etc.)
	const sortedParameters = [...gradeSummary.parameters].sort((a, b) => {
		const aNum = parseInt(a.name.split(' ')[1]);
		const bNum = parseInt(b.name.split(' ')[1]);
		return aNum - bNum;
	});

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between pr-8">
						Historial de Calificaciones
						<FaTrophy className="mr-6 text-2xl text-yellow-500" />
					</DialogTitle>
				</DialogHeader>

				<div className="mt-4 space-y-6">
					{/* Parameters and their activities */}
					{sortedParameters.map((param, index) => (
						<div key={index} className="rounded-lg border p-4">
							<div className="mb-2 flex items-center justify-between">
								<h3 className="text-lg font-bold">
									{param.name}{' '}
									<span className="text-gray-500">({param.weight}%)</span>
								</h3>
								<div className="flex items-center">
									<StarIcon className="h-5 w-5 text-yellow-500" />
									<span className="ml-1 font-bold">
										{formatScore(param.grade)} →{' '}
										{formatScore(
											calculateContribution(param.grade, param.weight)
										)}
									</span>
								</div>
							</div>

							{/* Activities in this parameter with progress bars */}
							<div className="mb-3 space-y-3">
								{param.activities.map((activity, actIndex) => (
									<div key={actIndex} className="space-y-1">
										<div className="flex justify-between text-sm">
											<span className="text-background">{activity.name}</span>
											<span className="font-bold text-background">
												{formatScore(activity.grade)} ({activity.percentage}%)
											</span>
										</div>
										{/* Add progress bar */}
										<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
											<div
												className={`h-full transition-all duration-300 ${activity.grade >= 3 ? 'bg-green-500' : 'bg-red-500'}`}
												style={{ width: `${(activity.grade / 5) * 100}%` }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					))}

					{/* Final grade with dynamic background and emoji */}
					<div
						className={`rounded-lg p-4 ${
							gradeSummary.finalGrade >= 3 ? 'bg-green-50' : 'bg-red-50'
						}`}
					>
						<h3 className="mb-2 text-center text-lg font-bold text-background">
							Nota Final del Curso
						</h3>
						<div className="flex items-center justify-center space-x-2">
							{gradeSummary.finalGrade >= 3 ? (
								<ImHappy className="h-6 w-6 text-green-500" />
							) : (
								<PiSmileySad className="h-6 w-6 text-red-500" />
							)}
							<StarIcon className="h-6 w-6 text-yellow-500" />
							<span
								className={`text-2xl font-bold ${gradeSummary.finalGrade >= 3 ? 'text-green-600' : 'text-red-600'}`}
							>
								{formatScore(gradeSummary.finalGrade)}
							</span>
						</div>
						<div
							className={`mt-2 text-center text-sm ${
								gradeSummary.finalGrade >= 3 ? 'text-green-700' : 'text-red-700'
							}`}
						>
							Calculado como suma de (nota × peso/100) para cada parámetro
						</div>
					</div>

					{/* Add close button */}
					<div className="mt-6 flex justify-end">
						<button
							onClick={onClose}
							className="rounded-lg bg-[#00BDD8] px-6 py-2.5 font-semibold text-white transition-all duration-200 hover:bg-[#00A5C0] active:scale-95"
						>
							Cerrar
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
