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
					<div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
						{gradeSummary.parameters.map((param, index) => (
							<div key={index} className="flex justify-between p-4">
								<div>
									<h4 className="font-medium text-gray-900">{param.name}</h4>
									<p className="text-sm text-gray-500">Peso: {param.weight}%</p>
								</div>
								<div className="text-lg font-bold text-primary">
									{param.grade.toFixed(1)}
								</div>
							</div>
						))}
					</div>

					<div className="mt-6 rounded-lg bg-gray-50 p-4">
						<div className="flex justify-between">
							<span className="text-lg font-bold text-gray-900">
								Nota Final del Curso
							</span>
							<span className="text-2xl font-bold text-primary">
								{gradeSummary.finalGrade.toFixed(1)}
							</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
