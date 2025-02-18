'use client';
import { useState, useEffect } from 'react';
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

	useEffect(() => {
		fetchRespuestas();
	}, [activityId]);

	useEffect(() => {
		// Inicializar las calificaciones cuando se cargan las respuestas
		const initialGrades: Record<string, string> = {};
		Object.entries(respuestas).forEach(([key, respuesta]) => {
			initialGrades[key] = respuesta.grade?.toString() ?? '';
		});
		setGrades(initialGrades);
	}, [respuestas]);

	const fetchRespuestas = async () => {
		try {
			const response = await fetch(
				`/api/educadores/respuestas-archivos/${activityId}`
			);
			if (!response.ok) throw new Error('Error al obtener respuestas');
			const data = await response.json();
			setRespuestas(data.respuestas);
		} catch (error) {
			console.error('Error:', error);
			toast({
				title: 'Error',
				description: 'No se pudieron cargar las respuestas',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const calificarRespuesta = async (
		userId: string,
		questionId: string,
		grade: number
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
				}),
			});

			if (!response.ok) throw new Error('Error al calificar');

			toast({
				title: 'Éxito',
				description: 'Calificación guardada correctamente',
			});
			await fetchRespuestas();
		} catch (error) {
			console.error('Error al calificar:', error);
			toast({
				title: 'Error',
				description: 'No se pudo guardar la calificación',
				variant: 'destructive',
			});
		}
	};

	const handleGradeChange = (key: string, value: string) => {
		setGrades((prev) => ({ ...prev, [key]: value }));
	};

	const handleSubmitGrade = async (key: string) => {
		const grade = Number(grades[key]);
		if (!isNaN(grade) && grade >= 0 && grade <= 5) {
			const [, , questionId] = key.split(':');
			try {
				await calificarRespuesta(respuestas[key].userId, questionId, grade);
				toast({
					title: 'Éxito',
					description: 'Calificación enviada correctamente',
				});
			} catch (error) {
				console.error('Error al enviar calificación:', error);
				toast({
					title: 'Error',
					description: 'No se pudo enviar la calificación',
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
			<div className="grid gap-4 px-2 md:grid-cols-2">
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
												Archivo: {respuesta.fileName}
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
												{respuesta.status}
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
														value={grades[key]}
														onChange={(e) =>
															handleGradeChange(key, e.target.value)
														}
													/>
												</div>
												<Button
													onClick={() => handleSubmitGrade(key)}
													className="w-full border-green-500 bg-green-500 text-white transition-colors hover:bg-green-600"
												>
													<span className="mr-2">✓</span>
													Enviar Nota
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
