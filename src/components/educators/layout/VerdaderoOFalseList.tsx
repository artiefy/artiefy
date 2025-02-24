'use client';
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Edit, Trash } from 'lucide-react';
import QuestionVOFForm from '~/components/educators/layout/VerdaderoOFalseForm';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';
import type { VerdaderoOFlaso } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const QuestionVOFList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestionsVOF] = useState<VerdaderoOFlaso[]>([]);
	const [editingQuestion, setEditingQuestion] = useState<
		VerdaderoOFlaso | undefined
	>(undefined);
	const [loading, setLoading] = useState(true);

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
			toast({
				title: 'Error',
				description: 'Error al cargar las preguntas',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [activityId]);

	useEffect(() => {
		void fetchQuestions();

		// Solo hacemos polling si estamos editando
		let interval: NodeJS.Timeout | undefined;
		if (editingQuestion) {
			interval = setInterval(() => void fetchQuestions(), 5000);
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [fetchQuestions, editingQuestion]);

	const handleEdit = (questionVOF: VerdaderoOFlaso) => {
		setEditingQuestion(questionVOF);
	};

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
				toast({
					title: 'Pregunta eliminada',
					description: 'La pregunta se eliminó correctamente',
				});
			}
		} catch (error) {
			console.error('Error al eliminar la pregunta:', error);
			toast({
				title: 'Error',
				description: 'Error al eliminar la pregunta',
				variant: 'destructive',
			});
		}
	};

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

	const handleCancel = () => {
		setEditingQuestion(undefined);
	};

	if (loading && questions.length > 0) {
		return <div>Cargando preguntas...</div>;
	}

	return (
		<div className="my-2 space-y-4">
			{editingQuestion ? (
				<QuestionVOFForm
					activityId={activityId}
					questionToEdit={editingQuestion}
					onSubmit={handleFormSubmit}
					onCancel={handleCancel}
					isUploading={false}
				/>
			) : questions.length > 0 ? (
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<h2 className="text-center text-2xl font-bold">
								Preguntas de tipo: Verdadero o Falso.
							</h2>
							<h3 className="text-lg font-semibold">Pregunta:</h3>
							<p className="ml-2">{question.text}</p>
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
			) : (
				<></>
			)}
		</div>
	);
};

export default QuestionVOFList;
