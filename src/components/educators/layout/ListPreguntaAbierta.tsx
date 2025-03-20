'use client';

import { useState, useEffect, useCallback } from 'react';

import { Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

import PreguntasAbiertas from '~/components/educators/layout/PreguntasAbiertas';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';

import type { Completado } from '~/types/typesActi';

// Propiedades del componente para la lista de preguntas
interface QuestionListProps {
	activityId: number;
}

const ListPreguntaAbierta: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<Completado[]>([]); // Estado para las preguntas
	const [editingQuestion, setEditingQuestion] = useState<
		Completado | undefined
	>(undefined); // Estado para la edición de preguntas
	const [loading, setLoading] = useState<boolean>(true); // Estado para el estado de carga

	// Función para obtener las preguntas
	const fetchQuestions = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/educadores/question/completar?activityId=${activityId}`
			);
			if (!response.ok) {
				throw new Error('Error al obtener las preguntas');
			}
			const data = (await response.json()) as {
				success: boolean;
				questionsACompletar: Completado[];
			};

			if (data.success) {
				const filteredQuestions =
					data.questionsACompletar?.filter(
						(q) => q?.text && q?.correctAnswer
					) ?? [];

				setQuestions(filteredQuestions);
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
	const handleEdit = (question: Completado) => {
		setEditingQuestion(question);
	};

	// Función para eliminar una pregunta
	const handleDelete = async (questionId: string) => {
		try {
			const response = await fetch(
				`/api/educadores/question/completar?activityId=${activityId}&questionId=${questionId}`,
				{
					method: 'DELETE',
				}
			);
			if (response.ok) {
				// Actualizar el estado local en lugar de hacer fetch
				setQuestions((prevQuestions) =>
					prevQuestions.filter((q) => q.id !== questionId)
				);
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

	// Función para manejar el envio del formulario
	const handleFormSubmit = (question: Completado) => {
		// Actualizamos el estado local inmediatamente
		if (editingQuestion) {
			// Si estamos editando, reemplazamos la pregunta existente
			setQuestions((prevQuestions) =>
				prevQuestions.map((q) => (q.id === question.id ? question : q))
			);
		} else {
			// Si es una nueva pregunta, la añadimos al array
			setQuestions((prevQuestions) => [...prevQuestions, question]);
		}
		// Hacemos fetch para asegurar sincronización con el servidor
		void fetchQuestions();
	};

	// Función para cancelar la edición
	const handleCancel = () => {
		setEditingQuestion(undefined);
	};

	// Retorno la vista del componente y manejo de estados
	if (loading && questions.length > 0) {
		return <div>Cargando preguntas...</div>;
	}

	// Retorno la vista del componente
	return (
		<div className="my-2 space-y-4">
			{editingQuestion ? (
				<PreguntasAbiertas
					activityId={activityId}
					editingQuestion={editingQuestion}
					onSubmit={handleFormSubmit}
					onCancel={handleCancel}
					isUploading={false}
				/>
			) : questions.length > 0 ? (
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<h2 className="text-center text-2xl font-bold">
								Preguntas de tipo: Completar.
							</h2>
							<h3 className="text-lg font-semibold">Pregunta:</h3>
							<p className="text-sm font-semibold">{question.text}</p>
							<p>Pregunta abierta</p>
							<p>{question.pesoPregunta}%</p>
							<p className="my-2 font-bold">Respuesta:</p>
							<p className="font-bold">{question.correctAnswer}</p>
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
