'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Edit, Trash } from 'lucide-react';
import QuestionForm from '~/components/educators/layout/QuestionsForms';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';
import type { Question } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const QuestionList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(
		undefined
	);

	const fetchQuestions = async () => {
		try {
			const response = await fetch(
				`/api/educadores/question/opcionMulti?activityId=${activityId}`
			);
			const data = (await response.json()) as {
				success: boolean;
				questionsOM: Question[];
			};
			if (data.success) {
				setQuestions(
					data.questionsOM?.filter(
						(q) => q?.text && q?.options && Array.isArray(q.options)
					) ?? []
				);
			} else {
				setQuestions([]);
			}
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
			setQuestions([]);
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

	const handleEdit = (question: Question) => {
		setEditingQuestion(question);
	};

	const handleDelete = async (questionId: string) => {
		try {
			const response = await fetch(
				`/api/educadores/question/opcionMulti?activityId=${activityId}&questionId=${questionId}`,
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

	const handleFormSubmit = (_question: Question) => {
		setEditingQuestion(undefined);
		void fetchQuestions();
	};

	return (
		<div className="my-2 space-y-4">
			{editingQuestion ? (
				<QuestionForm
					activityId={activityId}
					questionToEdit={editingQuestion}
					onSubmit={handleFormSubmit}
					isUploading={false}
				/>
			) : questions.length > 0 ? (
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<h2 className="mb-2 text-center text-2xl font-bold">
								Preguntas del tipo: opcion multiple
							</h2>
							<h3 className="text-lg font-semibold">Pregunta:</h3>
							<p className="mb-2">{question.text}</p>
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
										{option.id === question.correctOptionId
											? '(Respuesta correcta)'
											: ''}
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

export default QuestionList;
