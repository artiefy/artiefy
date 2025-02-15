'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import type { Completado } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const VerListPreguntaAbierta: React.FC<QuestionListProps> = ({
	activityId,
}) => {
	const [questions, setQuestions] = useState<Completado[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void fetchQuestions();
	}, [activityId]);

	const fetchQuestions = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/educadores/question/completar?activityId=${activityId}`
			);
			if (!response.ok) {
				throw new Error('Error al obtener las preguntas');
			}
			const data = (await response.json()) as {
				success: boolean;
				questions: Completado[];
			};
			if (data.success) {
				setQuestions(data.questions);
			}
			console.log('API response:', data); // Verificar la respuesta de la API
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <div className="text-center">Cargando actividad...</div>;

	return (
		<div className="my-2 space-y-4">
			{questions && questions.length > 0 ? (
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<p>Pregunta</p>
							<h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
							<p>Peso de la pregunta:</p>
							<p className="font-bold">{question.pesoPregunta}</p>
							<p>Palabra para completar la frase:</p>
							<input
								type="text"
								className="w-2/4 rounded-lg border border-slate-200 p-4 shadow-lg outline-none"
								placeholder="Ingrese aqui el complemento"
							/>
						</CardContent>
						<CardFooter>
							<Button type="button" variant="secondary" className="mr-2">
								Enviar
							</Button>
						</CardFooter>
					</Card>
				))
			) : (
				<p>No hay preguntas disponibles.</p>
			)}
		</div>
	);
};

export default VerListPreguntaAbierta;
