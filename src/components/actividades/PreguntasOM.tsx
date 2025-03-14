import React, { useState } from 'react';

import { Plus, X } from 'lucide-react';

import type { Question, Option } from '~/app/typesActi';

interface Props {
	onSubmit: (question: Question) => void;
}

const QuestionForm: React.FC<Props> = ({ onSubmit }) => {
	const [questionText, setQuestionText] = useState('');
	const [options, setOptions] = useState<Option[]>([]);
	const [correctOptionId, setCorrectOptionId] = useState<string>('');

	const handleAddOption = () => {
		if (options.length < 4) {
			const newOption: Option = {
				id: crypto.randomUUID(),
				text: '',
			};
			setOptions([...options, newOption]);
		}
	};

	const handleRemoveOption = (id: string) => {
		setOptions(options.filter((opt) => opt.id !== id));
		if (correctOptionId === id) {
			setCorrectOptionId('');
		}
	};

	const handleOptionChange = (id: string, text: string) => {
		setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (questionText && options.length === 4 && correctOptionId) {
			const question: Question = {
				id: crypto.randomUUID(),
				text: questionText,
				options,
				correctOptionId,
			};
			onSubmit(question);
			setQuestionText('');
			setOptions([]);
			setCorrectOptionId('');
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label
					htmlFor="question"
					className="mb-2 block text-sm font-medium text-gray-700"
				>
					Pregunta
				</label>
				<textarea
					id="question"
					value={questionText}
					onChange={(e) => setQuestionText(e.target.value)}
					className="w-full rounded-lg border border-gray-300 px-4 py-2 font-normal text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
					rows={3}
					placeholder="Escribe tu pregunta aquí..."
					required
				/>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<label className="block text-sm font-medium text-gray-700">
						Opciones de respuesta
					</label>
					{options.length < 4 && (
						<button
							type="button"
							onClick={handleAddOption}
							className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
						>
							<Plus className="size-4" /> Agregar opción
						</button>
					)}
				</div>

				{options.map((option, index) => (
					<div key={option.id} className="flex items-start gap-4">
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<input
									type="radio"
									name="correctOption"
									checked={correctOptionId === option.id}
									onChange={() => setCorrectOptionId(option.id)}
									className="size-4 text-indigo-600"
									required
								/>
								<input
									type="text"
									value={option.text}
									onChange={(e) =>
										handleOptionChange(option.id, e.target.value)
									}
									className="w-full rounded-lg border border-gray-300 px-4 py-2 text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
									placeholder={`Opción ${index + 1}`}
									required
								/>
							</div>
						</div>
						<button
							type="button"
							onClick={() => handleRemoveOption(option.id)}
							className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
						>
							<X className="size-4" />
						</button>
					</div>
				))}
			</div>

			<button
				type="submit"
				disabled={!questionText || options.length !== 4 || !correctOptionId}
				className="w-full rounded-lg bg-indigo-600 py-3 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
			>
				Guardar Pregunta
			</button>
			{!questionText && (
				<p className="text-red-500">La pregunta es requerida</p>
			)}
			{options.length !== 4 && (
				<p className="text-red-500">Se requieren 4 opciones</p>
			)}
			{!correctOptionId && (
				<p className="text-red-500">Selecciona la respuesta correcta</p>
			)}
		</form>
	);
};

export default QuestionForm;
