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

	const handleGradeBlur = (key: string) => {
		const grade = Number(grades[key]);
		if (!isNaN(grade) && grade >= 0 && grade <= 5) {
			const [, , questionId] = key.split(':');
			calificarRespuesta(respuestas[key].userId, questionId, grade);
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
		<div className="space-y-4">
			{Object.entries(respuestas).length > 0 &&
				Object.entries(respuestas).map(([key, respuesta]) => (
					<Card key={key}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">Archivo: {respuesta.fileName}</p>
									<p className="text-sm text-gray-500">
										Fecha: {new Date(respuesta.submittedAt).toLocaleString()}
									</p>
									<p className="text-sm text-gray-500">
										Usuario: {respuesta.userName}
									</p>
									<p className="text-sm text-gray-500">
										Estado: {respuesta.status}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										min="0"
										max="5"
										step="0.5"
										placeholder="Nota..."
										className="w-20 border-slate-500"
										value={grades[key]}
										onChange={(e) => handleGradeChange(key, e.target.value)}
										onBlur={() => handleGradeBlur(key)}
									/>
									<Button
										onClick={() => descargarArchivo(key)}
										variant="outline"
										className="text-white hover:text-blue-800"
									>
										Descargar
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
		</div>
	);
}
