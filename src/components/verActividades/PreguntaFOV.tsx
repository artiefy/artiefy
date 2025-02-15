'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import type { VerdaderoOFlaso } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
}

const VerQuestionVOFList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questionsVOF, setQuestionsVOF] = useState<VerdaderoOFlaso[]>([]);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<number, number | null>
	>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void fetchQuestions();
	}, [activityId]);

	const fetchQuestions = async () => {
		setLoading(true);
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
				questionsVOF?: VerdaderoOFlaso[];
			};
			console.log('API data:', data); // Add logging
			if (data.success && data.questionsVOF) {
				// Asegurarse de que los objetos dentro del arreglo options se están deserializando correctamente
				const deserializedQuestions = data.questionsVOF.map((question) => ({
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
		} finally {
			setLoading(false);
		}
	};

	const handleOptionChange = (questionId: number, optionId: number) => {
		setSelectedOptions((prev) => ({
			...prev,
			[questionId]: optionId,
		}));
	};

	if (loading) return <div className="text-center">Cargando actividad...</div>;

	return (
		<div className="my-2 space-y-4">
			{questionsVOF && questionsVOF.length > 0 ? (
				questionsVOF.map((question) => (
					<Card
						key={question.id}
						className="justify-start border-none shadow-lg"
					>
						<CardContent className="pt-6">
							<h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
							<ul className="space-y-1">
								{question.options?.map((option) => (
									<li key={option.id}>
										<label className={'text-black'}>
											<input
												type="radio"
												name={`question-${question.id}`}
												value={option.id}
												className="mr-2"
												checked={selectedOptions[question.id] === option.id}
												onChange={() =>
													handleOptionChange(question.id, option.id)
												}
											/>
											{option.text}
										</label>
									</li>
								))}
							</ul>
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

export default VerQuestionVOFList;
