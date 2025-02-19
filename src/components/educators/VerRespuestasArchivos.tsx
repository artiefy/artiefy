'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '~/components/educators/ui/card';
import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { toast } from '~/hooks/use-toast';

interface RespuestaArchivo {
	fileName: string;
	submittedAt: string;
	userId: string;
	userName: string;
	status: string;
	grade: number | null;
}

export default function VerRespuestasArchivos({
	activityId,
}: {
	activityId: number;
}) {
	const [respuestas, setRespuestas] = useState<
		Record<string, RespuestaArchivo>
	>({});
	const [loading, setLoading] = useState(true);
	const [grades, setGrades] = useState<Record<string, string>>({});

	const fetchRespuestas = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/educadores/respuestas-archivos/${activityId}`
			);
			if (!response.ok) throw new Error('Error al obtener respuestas');
			const data = await response.json();

			// Inicializar las calificaciones con los valores de la base de datos
			const initialGrades: Record<string, string> = {};
			Object.entries(data.respuestas).forEach(([key, respuesta]) => {
				const grade = (respuesta as RespuestaArchivo).grade;
				// Si grade es null o undefined, establecemos un string vacío
				initialGrades[key] = grade !== null ? grade.toString() : '';
			});

			setRespuestas(data.respuestas);
			setGrades(initialGrades);
		} catch (error) {
			console.error('Error al cargar respuestas:', error);
			toast({
				title: 'Error',
				description: 'No se pudieron cargar las respuestas',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [activityId]);

	useEffect(() => {
		fetchRespuestas();
	}, [fetchRespuestas]);

	const calificarRespuesta = async (
		userId: string,
		questionId: string,
		grade: number,
		submissionKey: string
	) => {
		try {
			const response = await fetch('/api/educadores/calificar-archivo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					activityId,
					questionId,
					userId,
					grade,
					submissionKey,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Error al calificar');
			}

			if (!data.success) {
				throw new Error('La calificación no se guardó correctamente');
			}

			// Actualizar el estado local inmediatamente
			setRespuestas((prev) => ({
				...prev,
				[submissionKey]: {
					...prev[submissionKey],
					grade,
					status: 'calificado',
				},
			}));

			setGrades((prev) => ({
				...prev,
				[submissionKey]: grade.toString(),
			}));

			toast({
				title: 'Éxito',
				description: 'Calificación guardada correctamente',
			});
		} catch (error) {
			console.error('Error detallado al calificar:', error);
			toast({
				title: 'Error',
				description:
					error instanceof Error ? error.message : 'Error al calificar',
				variant: 'destructive',
			});
			throw error;
		}
	};

	const handleGradeChange = (key: string, value: string) => {
		// Validar que el valor sea un número o vacío
		if (
			value === '' ||
			(!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 5)
		) {
			setGrades((prev) => ({ ...prev, [key]: value }));
		}
	};

	const handleSubmitGrade = async (key: string) => {
		const grade = Number(grades[key]);
		if (!isNaN(grade) && grade >= 0 && grade <= 5) {
			try {
				const keyParts = key.split(':');
				const questionId = keyParts[2];

				await calificarRespuesta(
					respuestas[key].userId,
					questionId,
					grade,
					key
				);
			} catch (error) {
				console.error('Error en handleSubmitGrade:', error);
				await fetchRespuestas();
				toast({
					title: 'Error',
					description:
						'No se pudo guardar la calificación. Intentando recargar los datos.',
					variant: 'destructive',
				});
			}
		} else {
			toast({
				title: 'Error',
				description: 'La calificación debe estar entre 0 y 5',
				variant: 'destructive',
			});
		}
	};

	const descargarArchivo = async (key: string) => {
		try {
			const response = await fetch(`/api/educadores/descargar-archivo/${key}`);
			if (!response.ok) throw new Error('Error al descargar archivo');

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = respuestas[key].fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error:', error);
			toast({
				title: 'Error',
				description: 'No se pudo descargar el archivo',
				variant: 'destructive',
			});
		}
	};

	if (loading) return <div>Cargando respuestas...</div>;

	return (
		<div>
			<h2 className="my-2 ml-4 text-xl font-semibold text-blue-600">
				Respuestas de los Estudiantes
			</h2>
			<div className="grid gap-4 px-2 pb-4 md:grid-cols-2">
				{Object.entries(respuestas).length > 0 ? (
					Object.entries(respuestas).map(([key, respuesta]) => (
						<Card
							key={key}
							className="border-slate-200 transition-all hover:shadow-lg"
						>
							<CardContent className="p-6">
								<div className="space-y-4">
									<div className="flex items-start justify-between">
										<div className="space-y-1">
											<h3 className="text-lg font-semibold">
												Estudiante: {respuesta.userName}
											</h3>
											<p className="text-sm text-gray-500">
												Archivo: <b>{respuesta.fileName}</b>
											</p>
											<p className="text-sm text-gray-500">
												Enviado:{' '}
												{new Date(respuesta.submittedAt).toLocaleString()}
											</p>
											<span
												className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
													respuesta.status === 'pendiente'
														? 'bg-yellow-100 text-yellow-800'
														: 'bg-green-100 text-green-800'
												}`}
											>
												{respuesta.status === 'calificado'
													? 'Calificado'
													: 'Pendiente'}
											</span>
										</div>
										<div className="flex flex-col items-end gap-2">
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<label className="text-sm font-medium">
														Calificación:
													</label>
													<Input
														type="number"
														min="0"
														max="5"
														step="0.1"
														placeholder="0-5"
														className="w-20 border-slate-300 text-center"
														value={grades[key] ?? ''}
														onChange={(e) =>
															handleGradeChange(key, e.target.value)
														}
													/>
												</div>
												<Button
													onClick={() => handleSubmitGrade(key)}
													className={`w-full transition-colors ${
														respuesta.status === 'calificado'
															? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
															: 'border-green-500 bg-green-500 text-white hover:bg-green-600'
													}`}
												>
													{respuesta.status === 'calificado'
														? '✏️ Actualizar Nota'
														: '✓ Enviar Nota'}
												</Button>
											</div>
											<Button
												onClick={() => descargarArchivo(key)}
												className="mt-2 w-full border-slate-300 text-black transition-colors hover:bg-blue-50"
											>
												<span className="mr-2">📥</span>
												Descargar
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				) : (
					<p className="col-span-2 text-center text-gray-500">
						No hay respuestas disponibles
					</p>
				)}
			</div>
		</div>
	);
}
