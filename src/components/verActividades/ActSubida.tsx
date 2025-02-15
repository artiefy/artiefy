'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import { Input } from '~/components/educators/ui/input';
import type { QuestionFilesSubida } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const actSubida: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<QuestionFilesSubida[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		void fetchQuestions();
	}, [activityId]);

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

	if (loading) return <>Cargando actividad...</>;

	return (
		<div className="my-2 space-y-4">
			{questions && questions.length > 0 ? (
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<h3 className="mb-2 text-lg font-semibold">
								Pregunta de subida de archivos
							</h3>
							<p>Pregunta actividad:</p>
							<p className="font-bold">{question.text}</p>
							<p>Parametros de evaluacion:</p>
							<p className="font-bold">{question.parametros}</p>
							<p>Peso de la pregunta:</p>
							<p className="font-bold">{question.pesoNota}</p>
						</CardContent>
						<CardFooter className="flex justify-end space-x-2">
							<p>En este input puedes subir el archivo:</p>
							<Input type="file" />
						</CardFooter>
						<Button type="submit">Subir</Button>
					</Card>
				))
			) : (
				<p>No hay preguntas disponibles.</p>
			)}
		</div>
	);
};

export default actSubida;
