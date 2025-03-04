'use client';
import { useState, useEffect } from 'react';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
import type { Activity, Question } from '~/types';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

interface ActivityModalProps {
	isOpen: boolean;
	onClose: () => void;
	activity: Activity;
	userId: string;
	onQuestionsAnswered: (allAnswered: boolean) => void;
	markActivityAsCompleted: () => void; // New prop for activity completion callback
}

const LessonActivityModal = ({
	isOpen,
	onClose,
	activity,
}: ActivityModalProps) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
	const [questions, setQuestions] = useState<Question[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (activity?.content?.questions) {
			setQuestions(activity.content.questions);
		}
		setIsLoading(false);
	}, [activity]);

	const currentQuestion = questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;

	const handleAnswer = (answer: string) => {
		setUserAnswers((prev) => ({
			...prev,
			[currentQuestion.id]: answer,
		}));
	};

	const handleNext = () => {
		if (!isLastQuestion) {
			setCurrentQuestionIndex((prev) => prev + 1);
		}
	};

	const renderQuestion = () => {
		if (!currentQuestion) return null;

		switch (currentQuestion.type) {
			case 'VOF':
				return (
					<div className="space-y-4">
						<h3 className="font-semibold">{currentQuestion.text}</h3>
						<div className="space-y-2">
							{currentQuestion.options?.map((option) => (
								<label key={option.id} className="block">
									<input
										type="radio"
										name={currentQuestion.id}
										value={option.id}
										checked={userAnswers[currentQuestion.id] === option.id}
										onChange={(e) => handleAnswer(e.target.value)}
									/>
									<span className="ml-2">{option.text}</span>
								</label>
							))}
						</div>
					</div>
				);

			case 'OM':
				return (
					<div className="space-y-4">
						<h3 className="font-semibold">{currentQuestion.text}</h3>
						<div className="space-y-2">
							{currentQuestion.options?.map((option) => (
								<label key={option.id} className="block">
									<input
										type="radio"
										name={currentQuestion.id}
										value={option.id}
										checked={userAnswers[currentQuestion.id] === option.id}
										onChange={(e) => handleAnswer(e.target.value)}
									/>
									<span className="ml-2">{option.text}</span>
								</label>
							))}
						</div>
					</div>
				);

			case 'COMPLETAR':
				return (
					<div className="space-y-4">
						<h3 className="font-semibold">{currentQuestion.text}</h3>
						<input
							type="text"
							value={userAnswers[currentQuestion.id] || ''}
							onChange={(e) => handleAnswer(e.target.value)}
							className="w-full rounded-md border p-2"
							placeholder="Escribe tu respuesta..."
						/>
					</div>
				);
		}
	};

	if (isLoading) {
		return (
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Actividad</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="h-32 w-full" />
						<div className="flex justify-between">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-24" />
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Actividad</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="flex justify-center">
						<Icons.spinner className="h-8 w-8 animate-spin" />
					</div>
				) : (
					<div className="space-y-6">
						{renderQuestion()}

						<div className="flex justify-between">
							<Button
								onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
								disabled={currentQuestionIndex === 0}
							>
								Anterior
							</Button>

							<Button
								onClick={handleNext}
								disabled={!userAnswers[currentQuestion?.id]}
							>
								{isLastQuestion ? 'Finalizar' : 'Siguiente'}
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default LessonActivityModal;
