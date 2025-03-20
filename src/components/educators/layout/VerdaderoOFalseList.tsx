'use client';
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';

import { Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

import QuestionVOFForm from '~/components/educators/layout/VerdaderoOFalseForm';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';

import type { VerdaderoOFlaso } from '~/types/typesActi';

// Propiedades del componente para la lista de preguntas
interface QuestionListProps {
	activityId: number;
}

const QuestionVOFList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestionsVOF] = useState<VerdaderoOFlaso[]>([]); // Estado para las preguntas
	const [editingQuestion, setEditingQuestion] = useState<
		VerdaderoOFlaso | undefined
	>(undefined); // Estado para la edición de preguntas
	const [loading, setLoading] = useState(true); // Estado para el estado de carga

	// Función para obtener las preguntas
	const fetchQuestions = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/educadores/question/VerdaderoOFalso?activityId=${activityId}`
			);
			if (!response.ok) {
				throw new Error(`Error fetching questions: ${response.statusText}`);
			}
			const data = (await response.json()) as {
				success: boolean;
				questionsVOF?: VerdaderoOFlaso[];
			};

			if (data.success && data.questionsVOF) {
				setQuestionsVOF(data.questionsVOF);
			}
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
			toast('Error', {
				description: 'Error al cargar las preguntas',
			});
		} finally {
			setLoading(false);
		}
	}, [activityId]);

	// Efecto para obtener las preguntas al cargar el componente
	useEffect(() => {
		void fetchQuestions();
	}, [fetchQuestions]);

	// Función para editar una pregunta
	const handleEdit = (questionVOF: VerdaderoOFlaso) => {
		setEditingQuestion(questionVOF);
	};

	// Función para eliminar una pregunta
	const handleDelete = async (questionId: string) => {
		try {
			const response = await fetch(
				`/api/educadores/question/VerdaderoOFalso?activityId=${activityId}&questionId=${questionId}`,
				{
					method: 'DELETE',
				}
			);
			if (response.ok) {
				// Actualizar el estado local en lugar de hacer fetch
				setQuestionsVOF(questions.filter((q) => q.id !== questionId));
				toast('Pregunta eliminada', {
					description: 'La pregunta se eliminó correctamente',
				});
			}
		} catch (error) {
			console.error('Error al eliminar la pregunta:', error);
			toast('Error', {
				description: 'Error al eliminar la pregunta',
			});
		}
	};

	// Función para manejar la submisión del formulario
	const handleFormSubmit = (question: VerdaderoOFlaso) => {
		setEditingQuestion(undefined);
		// Actualizamos el estado local inmediatamente
		if (editingQuestion) {
			// Si estamos editando, reemplazamos la pregunta existente
			setQuestionsVOF((prevQuestions) =>
				prevQuestions.map((q) => (q.id === question.id ? question : q))
			);
		} else {
			// Si es una nueva pregunta, la añadimos al array
			setQuestionsVOF((prevQuestions) => [...prevQuestions, question]);
		}
		// Hacemos fetch para asegurar sincronización con el servidor
		void fetchQuestions();
	};

	// Función para cancelar la edición
	const handleCancel = () => {
		setEditingQuestion(undefined);
	};

	// Retorno la vista del componente
	if (loading && questions.length > 0) {
		return <div>Cargando preguntas...</div>;
	}

	return (
		<div className="my-2 space-y-4">
			{editingQuestion ? (
				<QuestionVOFForm
					activityId={activityId}
					editingQuestion={editingQuestion}
					onSubmit={handleFormSubmit}
					onCancel={handleCancel}
					isUploading={false}
				/>
			) : (
				questions.length > 0 &&
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<h2 className="text-center text-2xl font-bold">
								Preguntas de tipo: Verdadero o Falso.
							</h2>
							<h3 className="text-lg font-semibold">Pregunta:</h3>
							<p className="ml-2">{question.text}</p>
							<h4 className="text-sm font-semibold">Peso de la pregunta</h4>
							<p>{question.pesoPregunta}%</p>
							<ul className="list-inside list-disc space-y-1">
								<span className="font-bold">Respuesta:</span>
								{question.options?.map((option) => (
									<li
										key={option.id}
										className={
											option.id === question.correctOptionId ? 'font-bold' : ''
										}
									>
										{option.text}{' '}
										{option.id === question.correctOptionId &&
											'(Respuesta correcta)'}
									</li>
								))}
							</ul>
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
			)}
		</div>
	);
};

export default QuestionVOFList;
