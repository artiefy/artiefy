'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
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

	useEffect(() => {
		const interval = setInterval(() => {
			void fetchQuestions();
		}, 5000); // Polling cada 5 segundos

		return () => clearInterval(interval);
	}, [activityId]);

	const fetchQuestions = async () => {
		try {
			const response = await fetch(
				`/api/educadores/question/VerdaderoOFalso?activityId=${activityId}`
			);
			console.log('API response:', response); // Add logging
			if (!response.ok) {
				throw new Error(`Error fetching questions: ${response.statusText}`);
			}
			const data = (await response.json()) as {
				success: boolean;
				questions?: VerdaderoOFlaso[];
			};
			console.log('API data:', data); // Add logging
			if (data.success && data.questions) {
				// Asegurarse de que los objetos dentro del arreglo options se están deserializando correctamente
				const deserializedQuestions = data.questions.map((question) => ({
					...question,
					options: question.options
						? question.options.map((option) => ({
								...option,
							}))
						: [],
				}));
				console.log('Fetched questions:', deserializedQuestions); // Add logging
				setQuestionsVOF(deserializedQuestions);
			} else {
				console.error('Error fetching questions: No questions found');
			}
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
		}
	};

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

	return (
		<div className="my-2 space-y-4">
			{editingQuestion ? (
				<QuestionVOFForm
					activityId={activityId}
					questionToEdit={editingQuestion}
					onSubmit={handleFormSubmit}
					isUploading={false}
				/>
			) : (
				questions.map((question) => (
					<Card key={question.id} className="border-none shadow-lg">
						<CardContent className="pt-6">
							<h2 className="text-center text-2xl font-bold">
								Preguntas de tipo: Verdadero o Falso.
							</h2>
							<h3 className="mb-2 flex flex-col text-lg font-semibold">
								Pregunta: {question.text}
							</h3>
							<ul className="list-inside list-disc space-y-1">
								{question.options?.map((option) => (
									<li
										key={option.id}
										className={
											option.id === question.correctOptionId ? 'font-bold' : ''
										}
									>
										{option.text}
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
