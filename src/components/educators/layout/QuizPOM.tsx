import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Question } from '~/app/typesActi';

interface Props {
	question: Question;
	onAnswer: (optionId: string) => void;
}

const Quiz: React.FC<Props> = ({ question, onAnswer }) => {
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [showFeedback, setShowFeedback] = useState(false);

	const handleOptionClick = (optionId: string) => {
		if (selectedOption) return; // Prevenir múltiples selecciones

		setSelectedOption(optionId);
		setShowFeedback(true);

		setTimeout(() => {
			setShowFeedback(false);
			setSelectedOption(null);
			onAnswer(optionId);
		}, 1500);
	};

	const isCorrect = selectedOption === question.correctOptionId;

	return (
		<div className="space-y-6">
			<div className="rounded-lg bg-indigo-50 p-6">
				<h2 className="mb-2 text-xl font-semibold text-indigo-900">
					{question.text}
				</h2>
			</div>

			{showFeedback && (
				<div
					className={`flex items-center gap-2 rounded-lg p-4 ${
						isCorrect
							? 'bg-green-100 text-green-800'
							: 'bg-red-100 text-red-800'
					}`}
				>
					{isCorrect ? (
						<>
							<CheckCircle2 className="size-5" />
							<span>¡Correcto! ¡Muy bien!</span>
						</>
					) : (
						<>
							<XCircle className="size-5" />
							<span>
								Incorrecto. La respuesta correcta era:{' '}
								{
									question.options.find(
										(opt) => opt.id === question.correctOptionId
									)?.text
								}
							</span>
						</>
					)}
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{question.options.map((option) => {
					const isSelected = selectedOption === option.id;
					const isCorrectOption = option.id === question.correctOptionId;

					let buttonStyle =
						'p-4 border-2 rounded-lg text-left transition-all duration-200 ';

					if (showFeedback && isSelected) {
						buttonStyle += isCorrectOption
							? 'bg-green-100 border-green-500 text-green-800'
							: 'bg-red-100 border-red-500 text-red-800';
					} else if (showFeedback && isCorrectOption) {
						buttonStyle += 'bg-green-100 border-green-500 text-green-800';
					} else {
						buttonStyle +=
							'bg-white border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200';
					}

					return (
						<button
							key={option.id}
							onClick={() => handleOptionClick(option.id)}
							disabled={showFeedback}
							className={buttonStyle}
						>
							<span className="text-gray-800">{option.text}</span>
							{showFeedback && isSelected && (
								<span className="ml-2">
									{isCorrectOption ? (
										<CheckCircle2 className="inline size-5 text-green-600" />
									) : (
										<XCircle className="inline size-5 text-red-600" />
									)}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default Quiz;
