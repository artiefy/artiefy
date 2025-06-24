'use client';
import { useEffect,useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import { Input } from '~/components/educators/ui/input';

import type { QuestionFilesSubida } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const ActSubida: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<QuestionFilesSubida[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<
		Record<string, File | null>
	>({});
	const [submitting, setSubmitting] = useState(false);
	const { user } = useUser();
	const userName = user?.fullName;

	console.log('userName', userName);
	useEffect(() => {
		const fetchQuestions = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/educadores/question/archivos?activityId=${activityId}`
				);
				if (!response.ok) {
					throw new Error('Error al obtener las preguntas');
				}
				const data = (await response.json()) as {
					success: boolean;
					questionsFilesSubida: QuestionFilesSubida[];
				};
				console.log('API response:', data); // Verificar la respuesta de la API
				if (data) {
					setQuestions(data.questionsFilesSubida);
				} else {
					console.error('Formato de datos incorrecto:', data);
				}
				setLoading(false);
			} catch (error) {
				console.error('Error al cargar las preguntas:', error);
			}
		};

		void fetchQuestions();
	}, [activityId]);

	const handleFileChange = (questionId: string, file: File | null) => {
		if (file) {
			// Validar tamaño del archivo (150MB = 150 * 1024 * 1024 bytes)
			const maxSize = 150 * 1024 * 1024;
			if (file.size > maxSize) {
				toast('Error', {
					description:
						'El archivo es demasiado grande. El tamaño máximo permitido es 150MB.',
				});
				return;
			}
		}

		setSelectedFiles((prev) => ({
			...prev,
			[questionId]: file,
		}));
	};

	const handleSubmit = async (questionId: string) => {
		const file = selectedFiles[questionId];
		if (!file) {
			alert('Por favor selecciona un archivo');
			return;
		}

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('activityId', activityId.toString());
			formData.append('questionId', questionId.toString());
			formData.append('userId', user?.id ?? '');
			formData.append('userName', userName ?? '');

			for (const [key, value] of formData.entries()) {
				console.log(`${key}: ${value instanceof File ? value.name : value}`);
			}

			console.log('formData', formData);

			const response = await fetch('/api/estudiantes/subir-archivo', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Error al subir el archivo');
			}

			toast('Archivo subido', {
				description: 'El archivo se subió correctamente',
			});
			setSelectedFiles((prev) => ({
				...prev,
				[questionId]: null,
			}));
		} catch (error) {
			console.error('Error:', error);
			toast('Error', {
				description: `Error al subir el archivo: ${(error as Error).message}`,
			});
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return <>Cargando actividad...</>;

	return (
		<div className="my-4 space-y-6">
			{questions && questions.length > 0 ? (
				questions.map((question, index) => (
					<Card
						key={index}
						className="h-auto overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
					>
						<CardContent className="space-y-4 p-6">
							<div className="mb-4 flex items-center space-x-2">
								<div className="rounded-full bg-blue-100 p-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="size-6 text-blue-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
										/>
									</svg>
								</div>
								<h3 className="text-xl font-semibold text-gray-800">
									Pregunta de subida de archivos {index + 1}
								</h3>
							</div>

							<div className="space-y-3">
								<div>
									<p className="mb-1 text-sm text-gray-600">
										Pregunta actividad:
									</p>
									<p className="rounded-md bg-gray-50 p-3 font-medium text-gray-800">
										{question.text}
									</p>
								</div>

								<div>
									<p className="mb-1 text-sm text-gray-600">
										Parámetros de evaluación:
									</p>
									<p className="rounded-md bg-gray-50 p-3 font-medium text-gray-800">
										{question.parametros}
									</p>
								</div>
							</div>
						</CardContent>

						<CardFooter className="bg-gray-50 px-6 py-4">
							<div className="w-full space-y-3">
								<div className="flex items-center justify-between">
									<label className="text-sm text-gray-600">
										Selecciona un archivo para subir:
									</label>
									<Input
										type="file"
										className="ml-4 w-auto flex-1 cursor-pointer rounded-md border-none"
										onChange={(e) =>
											handleFileChange(question.id, e.target.files?.[0] ?? null)
										}
										disabled={submitting}
										accept="*/*"
									/>
								</div>
								<Button
									type="button"
									className="rounded-md border-none bg-blue-600 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
									onClick={() => handleSubmit(question.id)}
									disabled={submitting || !selectedFiles[question.id]}
								>
									{submitting ? 'Subiendo...' : 'Subir archivo'}
								</Button>
							</div>
						</CardFooter>
					</Card>
				))
			) : (
				<Card className="border border-gray-200 p-6 text-center text-gray-500">
					No hay preguntas disponibles.
				</Card>
			)}
		</div>
	);
};

export default ActSubida;
