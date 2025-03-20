'use client';
import { useState, useEffect } from 'react';

import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';

import type { Question } from '~/types/typesActi';

interface QuestionListProps {
	activityId: number;
	onQuestionAnswered: (isCorrect: boolean) => void;
}

interface Feedback {
	isCorrect: boolean;
	message: string;
	attempted: boolean;
}

type FeedbackState = Record<string, Feedback>;

const VerQuestionList: React.FC<QuestionListProps> = ({
	activityId,
	onQuestionAnswered,
}) => {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({});
	const [loading, setLoading] = useState(true);
	const [feedback, setFeedback] = useState<FeedbackState>({});
	const paramActivityId = activityId;
	const activityIdNumber = paramActivityId
		? parseInt(paramActivityId.toString())
		: null;
	console.log(paramActivityId);

	useEffect(() => {
		const fetchQuestions = async () => {
			setLoading(true);
			try {
				const response = await fetch(
					`/api/educadores/question/opcionMulti?activityId=${activityIdNumber}`
				);
				const data = (await response.json()) as {
					success: boolean;
					questionsOM: Question[];
				};
				if (data.success) {
					setQuestions(data.questionsOM);
				}
			} catch (error) {
				console.error('Error al cargar las preguntas:', error);
			} finally {
				setLoading(false);
			}
		};

		if (activityIdNumber !== null) {
			void fetchQuestions();
		}
	}, [activityId, activityIdNumber]);

	const handleOptionChange = (questionId: string, optionId: string) => {
		setSelectedOptions((prev) => ({
			...prev,
			[questionId]: optionId,
		}));
	};

	const handleSubmit = (questionId: string, selectedOptionId: string) => {
		const currentQuestion = questions.find((q) => q.id === questionId);

		if (!selectedOptionId) {
			setFeedback((prev) => ({
				...prev,
				[questionId]: {
					isCorrect: false,
					message: 'Por favor, seleccione una opción',
					attempted: false,
				},
			}));
			return;
		}

		const isCorrect = selectedOptionId === currentQuestion?.correctOptionId;
		onQuestionAnswered(isCorrect);

		setFeedback((prev) => ({
			...prev,
			[questionId]: {
				isCorrect,
				message: isCorrect
					? '¡Correcto! 🎉'
					: `Incorrecto. La respuesta correcta es: "${
							currentQuestion?.options.find(
								(opt) => opt.id === currentQuestion.correctOptionId
							)?.text
						}" ❌`,
				attempted: true,
			},
		}));
	};

	if (loading) return <div className="text-center">Cargando actividad...</div>;

	return (
		<div className="space-y-4">
			{questions.map((question) => (
				<Card key={question.id} className="relative">
					<CardContent className="pt-6">
						<h3>Pregunta:</h3>
						<h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
						<ul className="space-y-1">
							{question.options.map((option) => (
								<li key={option.id}>
									<label className="text-black">
										<input
											type="radio"
											name={`question-${question.id}`}
											value={option.id}
											className="mr-2"
											checked={selectedOptions[question.id] === option.id}
											onChange={() =>
												handleOptionChange(question.id, option.id)
											}
											disabled={feedback[question.id]?.attempted}
										/>
										{option.text}
									</label>
								</li>
							))}
						</ul>
						{feedback[question.id] && (
							<p
								className={`mt-2 ${
									feedback[question.id].isCorrect
										? 'text-green-600'
										: 'text-red-600'
								}`}
							>
								{feedback[question.id].message}
							</p>
						)}
					</CardContent>
					<CardFooter>
						<Button
							type="button"
							variant="secondary"
							className="absolute right-10 bottom-6"
							onClick={() =>
								handleSubmit(question.id, selectedOptions[question.id] || '')
							}
							disabled={feedback[question.id]?.attempted}
						>
							Enviar
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
};

export default VerQuestionList;
