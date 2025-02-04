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

const QuestionList: React.FC<QuestionListProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<number, number | null>
	>({});
	const [feedback, setFeedback] = useState<string | null>(null);
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
		}
	};

	const handleOptionChange = (questionId: number, optionId: string) => {
		setSelectedOptions((prev) => ({
			...prev,
			[questionId]: parseInt(optionId),
		}));
	};

	const handleSubmit = (questionId: number, correctOptionId: string) => {
		const selectedOptionId = selectedOptions[questionId];
		if (selectedOptionId === parseInt(correctOptionId)) {
			setFeedback('¡Correcto!');
		} else {
			setFeedback('Incorrecto, intenta de nuevo.');
		}
	};

	return (
		<div className="space-y-4">
			{questions.map((question) => (
				<Card key={question.id}>
					<CardContent className="pt-6">
						<h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
						<ul className="list-inside list-disc space-y-1">
							{question.options.map((option) => (
								<li key={option.id}>
									<label
										className={
											option.id === question.correctOptionId
												? 'font-bold text-indigo-500'
												: ''
										}
									>
										<input
											type="radio"
											name={`question-${question.id}`}
											value={option.id}
											checked={
												selectedOptions[question.id] === parseInt(option.id)
											}
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
							onClick={() =>
								handleSubmit(question.id, question.correctOptionId)
							}
						>
							Enviar
						</Button>
						{feedback && <p>{feedback}</p>}
					</CardFooter>
				</Card>
			))}
		</div>
	);
};

export default QuestionList;
