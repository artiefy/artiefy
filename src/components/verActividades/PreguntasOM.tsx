'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import type { Question } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number | null;
}

const VerQuestionList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<number, number | null>
	>({});
	const [loading, setLoading] = useState(true);

	const [feedback, setFeedback] = useState<Record<number, string | null>>({});
	const params = useParams();
	const paramActivityId = params?.activityId;
	const activityIdString = Array.isArray(paramActivityId)
		? paramActivityId[0]
		: paramActivityId;
	const activityIdNumber = activityIdString ? parseInt(activityIdString) : null;
	console.log(paramActivityId);

	useEffect(() => {
		void fetchQuestions();
	}, [activityId]);

	const fetchQuestions = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/educadores/question?activityId=${activityIdNumber}`
			);
			const data = (await response.json()) as {
				success: boolean;
				questions: Question[];
			};
			if (data.success) {
				setQuestions(data.questions);
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

	const handleSubmit = (questionId: number, correctOptionId: number) => {
		const selectedOptionId = selectedOptions[questionId];
		setFeedback((prev) => ({
			...prev,
			[questionId]:
				selectedOptionId === correctOptionId
					? '¡Correcto!'
					: 'Incorrecto, intenta de nuevo.',
		}));
	};

	if (loading) return <div className="text-center">Cargando actividad...</div>;

	return (
		<div className="space-y-4">
			{questions.map((question: Question) => (
				<Card key={question.id}>
					<CardContent className="pt-6">
						<h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
						<ul className="space-y-1">
							{question.options.map((option) => (
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
						<Button
							type="button"
							variant="secondary"
							className="mr-2"
							onClick={() =>
								handleSubmit(question.id, question.correctOptionId)
							}
						>
							Enviar
						</Button>
						{feedback[question.id] && <p>{feedback[question.id]}</p>}
					</CardFooter>
				</Card>
			))}
		</div>
	);
};

export default VerQuestionList;
