'use client';
import { useState, useEffect, useCallback } from 'react';

import { Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

import FormActCompletado from '~/components/educators/layout/FormActCompletado';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';

import type { QuestionFilesSubida } from '~/types/typesActi';

// Propiedades del componente para la lista de preguntas
interface QuestionListProps {
	activityId: number;
}

const QuestionSubidaList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<QuestionFilesSubida[]>([]); // Estado para las preguntas
	const [editingQuestion, setEditingQuestion] = useState<
		QuestionFilesSubida | undefined
	>(undefined); // Estado para la edición de preguntas
	const [loading, setLoading] = useState(true); // Estado para el estado de carga

	// Función para obtener las preguntas
	const fetchQuestions = useCallback(async () => {
		try {
			setLoading(true);
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

			// Comparar si las preguntas han cambiado antes de actualizar el estado
			const hasQuestionsChanged =
				JSON.stringify(data.questionsFilesSubida) !== JSON.stringify(questions);

			if (hasQuestionsChanged) {
				setQuestions(data.questionsFilesSubida);
			}
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
			toast('Error',{
				description: 'Error al cargar las preguntas',
			});
		} finally {
			setLoading(false);
		}
	}, [activityId, questions]);

	// Efecto para obtener las preguntas al cargar el componente y hacer polling si estamos editando
	useEffect(() => {
		void fetchQuestions();

		// Solo hacemos polling si estamos editando
		let interval: NodeJS.Timeout | undefined;
		if (editingQuestion) {
			interval = setInterval(() => {
				void fetchQuestions();
			}, 5000);
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [fetchQuestions, editingQuestion]);

	// Función para editar una pregunta
	const handleEdit = (question: QuestionFilesSubida) => {
		setEditingQuestion(question);
	};

	// Función para eliminar una pregunta
	const handleDelete = async (questionId: string) => {
		try {
			const response = await fetch(
				`/api/educadores/question/archivos?activityId=${activityId}&questionId=${questionId}`,
				{
					method: 'DELETE',
				}
			);
			if (response.ok) {
				// Actualizar el estado local en lugar de hacer fetch
				setQuestions(questions.filter((q) => q.id !== questionId));
				toast('Pregunta eliminada',{
					description: 'La pregunta se eliminó correctamente',
				});
			}
		} catch (error) {
			console.error('Error al eliminar la pregunta:', error);
			toast('Error',{
				description: 'Error al eliminar la pregunta',
			});
		}
	};

	// Función para manejar el envio del formulario
	const handleFormSubmit = () => {
		setEditingQuestion(undefined);
		void fetchQuestions();
	};

	// Función para cancelar la edición de una pregunta
	const handleCancel = () => {
		setEditingQuestion(undefined);
	};

	// Retorno la vista del componente
	if (loading && questions.length > 0) {
		return <div>Cargando preguntas...</div>;
	}

	// Retorno la vista del componente
	return (
		<div className="my-2 space-y-4">
			<FormActCompletado activityId={activityId} onSubmit={handleFormSubmit} />
			{questions.length > 0 ? (
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
				))
			) : (
				<p className="text-center text-gray-500">No hay preguntas creadas</p>
			)}
		</div>
	);
};

export default QuestionSubidaList;
