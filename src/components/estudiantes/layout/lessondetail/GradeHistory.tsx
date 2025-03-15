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
		}[];
	} | null;
}

export function GradeHistory({
	isOpen,
	onClose,
	gradeSummary,
}: GradeHistoryProps) {
	if (!gradeSummary) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between text-xl font-bold">
						Historial de Calificaciones
						<FaTrophy className="text-2xl text-yellow-500" />
					</DialogTitle>
				</DialogHeader>

				<div className="mt-4 space-y-4">
					{/* Course completion message if applicable */}
					{gradeSummary.courseCompleted && (
						<div className="rounded-lg bg-green-50 p-4 text-center">
							<h3 className="text-lg font-bold text-green-800">
								¡Felicidades! Has completado el curso
							</h3>
							<p className="text-sm text-green-600">
								Nota final del curso: {gradeSummary.finalGrade.toFixed(1)}
							</p>
						</div>
					)}

					{/* Parameters section */}
					<div className="space-y-2">
						<h4 className="font-semibold text-gray-700">
							Parámetros de Evaluación
						</h4>
						<div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
							{gradeSummary.parameters?.map((param, index) => (
								<div key={index} className="flex justify-between p-4">
									<div>
										<h4 className="font-medium text-gray-900">{param.name}</h4>
										<p className="text-sm text-gray-500">
											Peso: {param.weight}%
										</p>
									</div>
									<div className="flex items-center">
										<StarIcon className="mr-1 h-5 w-5 text-yellow-500" />
										<span className="text-lg font-bold text-primary">
											{param.grade.toFixed(1)}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Final grade */}
					<div className="mt-6 rounded-lg bg-gray-50 p-4">
						<div className="flex items-center justify-between">
							<span className="text-lg font-bold text-gray-900">
								Nota Final del Curso
							</span>
							<div className="flex items-center">
								<StarIcon className="mr-2 h-6 w-6 text-yellow-500" />
								<span className="text-2xl font-bold text-primary">
									{gradeSummary.finalGrade.toFixed(1)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
