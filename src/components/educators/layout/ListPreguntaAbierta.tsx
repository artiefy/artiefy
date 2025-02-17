'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Edit, Trash } from 'lucide-react';
import PreguntasAbiertas from '~/components/educators/layout/PreguntasAbiertas';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';
import type { Completado } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const ListPreguntaAbierta: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<Completado[]>([]);
	const [editingQuestion, setEditingQuestion] = useState<
		Completado | undefined
	>(undefined);
	const [loading, setLoading] = useState<boolean>(true);

	const fetchQuestions = async () => {
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
				setQuestions(
					data.questions?.filter((q) => q?.text && q?.palabra) ?? []
				);
			}
			console.log('API response:', data); // Verificar la respuesta de la API
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchQuestions();
		const interval = setInterval(() => {
			void fetchQuestions();
		}, 5000); // Polling cada 5 segundos

		return () => clearInterval(interval);
	}, [activityId]);

	const handleEdit = (question: Completado) => {
		setEditingQuestion(question);
	};

	const handleDelete = async (questionId: string) => {
		try {
			const response = await fetch(
				`/api/educadores/question/completar?activityId=${activityId}&questionId=${questionId}`,
				{
					method: 'DELETE',
				}
			);
			if (response.ok) {
				void fetchQuestions();
				toast({
					title: 'Pregunta eliminada',
					description: 'La pregunta se eliminó correctamente',
				});
			}
		} catch (error) {
			console.error('Error al eliminar la pregunta:', error);
		}
	};

	const handleFormSubmit = () => {
		setEditingQuestion(undefined);
		void fetchQuestions();
	};

	const handleCancel = () => {
		setEditingQuestion(undefined);
	};

	return (
		<div className="my-2 space-y-4">
			{editingQuestion ? (
				<PreguntasAbiertas
					activityId={activityId}
					questionToEdit={editingQuestion}
					onSubmit={handleFormSubmit}
					onCancel={handleCancel}
					isUploading={false}
				/>
			) : loading ? (
				<p>Cargando preguntas...</p>
			) : questions.length > 0 ? (
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<h2 className="text-center text-2xl font-bold">
								Preguntas de tipo: Completar.
							</h2>
							<h3 className="text-lg font-semibold">Pregunta:</h3>
							<p>{question.text}</p>
							<p className="my-2 font-bold">Respuesta:</p>
							<p className="font-bold">{question.palabra}</p>
						</CardContent>
						<CardFooter className="flex justify-end space-x-2">
							<Button
								onClick={() => handleEdit(question)}
								variant="outline"
								className="text-white hover:text-blue-800"
								size="sm"
							>
								<Edit className="mr-2 size-4" /> Editar
							</Button>
							<Button
								onClick={() => handleDelete(question.id)}
								variant="outline"
								className="text-red-600 hover:text-red-800"
								size="sm"
							>
								<Trash className="mr-2 size-4" /> Eliminar
							</Button>
						</CardFooter>
					</Card>
				))
			) : (
				<></>
			)}
		</div>
	);
};

export default ListPreguntaAbierta;
