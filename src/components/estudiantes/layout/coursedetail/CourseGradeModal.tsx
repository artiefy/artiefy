'use client';

import { useEffect, useState } from 'react';

import { FaTrophy } from 'react-icons/fa';
import { toast } from 'sonner';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
import { formatScore } from '~/utils/formatScore';

interface Materia {
	id: number;
	title: string;
	grade: number;
}

interface ApiResponse {
	materias: Materia[];
	error?: string;
}

interface GradeModalProps {
	isOpen: boolean;
	onCloseAction: () => void;
	courseTitle: string;
	courseId: number;
	userId: string;
}

export function GradeModal({
	isOpen,
	onCloseAction,
	courseTitle,
	courseId,
	userId,
}: GradeModalProps) {
	const [materias, setMaterias] = useState<Materia[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [calculatedFinalGrade, setCalculatedFinalGrade] = useState<
		number | null
	>(null);
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
	const [isFirstLoad, setIsFirstLoad] = useState(true);

	useEffect(() => {
		const fetchGrades = async () => {
			if (!isOpen) return;

			setIsLoading(true);
			try {
				const response = await fetch(
					`/api/grades/materias?userId=${userId}&courseId=${courseId}`
				);
				const data = (await response.json()) as ApiResponse;

				if (!response.ok) {
					throw new Error(data.error ?? 'Failed to fetch grades');
				}

				if (Array.isArray(data.materias)) {
					setMaterias(data.materias);
					const average =
						data.materias.reduce((acc, materia) => acc + materia.grade, 0) /
						data.materias.length;
					setCalculatedFinalGrade(Number(average.toFixed(2)));
				}
			} catch (error) {
				console.error('Error fetching grades:', error);
				toast.error(
					error instanceof Error
						? error.message
						: 'Error al cargar las calificaciones'
				);
			} finally {
				setIsLoading(false);
				if (isFirstLoad) {
					setIsFirstLoad(false);
				}
				if (!hasLoadedOnce) {
					setHasLoadedOnce(true);
				}
			}
		};

		if (isOpen) {
			void fetchGrades();
		}
	}, [isOpen, userId, courseId, hasLoadedOnce, isFirstLoad]);

	const renderMaterias = () => {
		// Show centered spinner on first load
		if (isFirstLoad && isLoading) {
			return (
				<div className="flex justify-center py-4">
					<Icons.spinner className="h-6 w-6 animate-spin text-primary" />
				</div>
			);
		}

		// Show materias with loading spinners in grades on subsequent loads
		return materias.map((materia) => (
			<div
				key={materia.id}
				className="flex items-center justify-between rounded-md bg-gray-50 p-3"
			>
				<span className="font-mediumt font-bold text-background">
					{materia.title}
				</span>
				{isLoading && !isFirstLoad ? (
					<Icons.spinner className="h-4 w-4 animate-spin text-gray-600" />
				) : (
					<span
						className={`font-semibold ${
							materia.grade >= 3 ? 'text-green-600' : 'text-red-600'
						}`}
					>
						{formatScore(materia.grade)}
					</span>
				)}
			</div>
		));
	};

	return (
		<Dialog open={isOpen} onOpenChange={onCloseAction}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl font-bold">
						<FaTrophy className="text-yellow-500" />
						Calificación Final del Curso
					</DialogTitle>
				</DialogHeader>
				<div className="mt-4">
					<h3 className="mb-4 text-lg font-semibold">{courseTitle}</h3>

					<div className="mb-6 rounded-lg bg-gray-100 p-4 text-center">
						{isLoading ? (
							<Icons.spinner className="mx-auto h-6 w-6 animate-spin text-background" />
						) : (
							<span
								className={`text-3xl font-bold ${
									(calculatedFinalGrade ?? 0) >= 3
										? 'text-green-600'
										: 'text-red-600'
								}`}
							>
								{formatScore(calculatedFinalGrade ?? 0)}
							</span>
						)}
					</div>

					<div className="space-y-3">
						<h4 className="font-semibold">Materias del curso:</h4>
						{isFirstLoad && isLoading ? (
							<div className="flex justify-center py-4">
								<Icons.spinner className="h-6 w-6 animate-spin text-primary" />
							</div>
						) : (
							<div className="space-y-2">{renderMaterias()}</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
