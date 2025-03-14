import React from 'react';

import type { Question } from '~/app/typesActi';

interface Props {
	question: Question;
	onAnswer: (optionId: string) => void;
}

const Quiz: React.FC<Props> = ({ question, onAnswer }) => {
	return (
		<div className="space-y-6">
			<div className="rounded-lg bg-indigo-50 p-6">
				<h2 className="mb-2 text-xl font-semibold text-indigo-900">
					{question.text}
				</h2>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{question.options.map((option) => (
					<button
						key={option.id}
						onClick={() => onAnswer(option.id)}
						className="rounded-lg border-2 border-indigo-100 bg-white p-4 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50"
					>
						<span className="text-gray-800">{option.text}</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default Quiz;
