'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Edit, Trash } from 'lucide-react';
import FormActCompletado from '~/components/educators/layout/FormActCompletado';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';
import type { QuestionFilesSubida } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const QuestionSubidaList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<QuestionFilesSubida[]>([]);
	const [editingQuestion, setEditingQuestion] = useState<
		QuestionFilesSubida | undefined
	>(undefined);

	const fetchQuestions = async () => {
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
			setQuestions(data.questionsFilesSubida);
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
			toast({
				title: 'Error',
				description: 'Error al cargar las preguntas',
				variant: 'destructive',
			});
		} finally {
			console.log('Preguntas cargadas:', questions);
		}
	};

	useEffect(() => {
		void fetchQuestions();
		const interval = setInterval(() => {
			void fetchQuestions();
		}, 5000); // Polling cada 5 segundos
		return () => {
			clearInterval(interval);
		};
	}, [activityId]);

	const handleEdit = (question: QuestionFilesSubida) => {
		setEditingQuestion(question);
	};

	const handleDelete = async (questionId: string) => {
		try {
			const response = await fetch(
				`/api/educadores/question/archivos?activityId=${activityId}&questionId=${questionId}`,
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
			<FormActCompletado activityId={activityId} onSubmit={handleFormSubmit} />
			{questions &&
				questions.length > 0 &&
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						{editingQuestion?.id === question.id ? (
							<FormActCompletado
								activityId={activityId}
								editingQuestion={editingQuestion}
								onSubmit={handleFormSubmit}
								onCancel={handleCancel}
							/>
						) : (
							<>
								<CardContent className="pt-6">
									<h3 className="mb-2 text-lg font-semibold">
										Pregunta de subida de archivos
									</h3>
									<p>Pregunta actividad:</p>
									<p className="font-bold">{question.text}</p>
									<p>Parametros de evaluacion:</p>
									<p className="font-bold">{question.parametros}</p>
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
							</>
						)}
					</Card>
				))}
		</div>
	);
};

export default QuestionSubidaList;
