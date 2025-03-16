import { StarIcon } from '@heroicons/react/24/solid';
import { FaTrophy } from 'react-icons/fa';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';

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

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						Historial de Calificaciones
						<FaTrophy className="text-2xl text-yellow-500" />
					</DialogTitle>
				</DialogHeader>

				<div className="mt-4 space-y-6">
					{/* Parameters and their activities */}
					{gradeSummary.parameters?.map((param, index) => (
						<div key={index} className="rounded-lg border p-4">
							<div className="mb-2 flex items-center justify-between">
								<h3 className="text-lg font-bold">
									{param.name}{' '}
									<span className="text-gray-500">({param.weight}%)</span>
								</h3>
								<div className="flex items-center">
									<StarIcon className="h-5 w-5 text-yellow-500" />
									<span className="ml-1 font-bold">
										{param.grade.toFixed(1)} →{' '}
										{calculateContribution(param.grade, param.weight)}
									</span>
								</div>
							</div>

							{/* Activities in this parameter */}
							<div className="mb-3 space-y-2">
								{param.activities.map((activity, actIndex) => (
									<div
										key={actIndex}
										className="flex justify-between rounded bg-gray-50 p-2"
									>
										<span>{activity.name}</span>
										<span className="font-bold">
											{activity.grade.toFixed(1)}
										</span>
									</div>
								))}
							</div>
						</div>
					))}

					{/* Final grade with calculation explanation */}
					<div className="rounded-lg bg-blue-50 p-4">
						<h3 className="mb-2 text-center text-lg font-bold">
							Nota Final del Curso
						</h3>
						<div className="flex items-center justify-center space-x-2">
							<StarIcon className="h-6 w-6 text-yellow-500" />
							<span className="text-2xl font-bold text-primary">
								{gradeSummary.finalGrade.toFixed(1)}
							</span>
						</div>
						<div className="mt-2 text-center text-sm text-gray-600">
							Calculado como suma de (nota × peso/100) para cada parámetro
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
