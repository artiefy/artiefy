'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import type { Question, Option } from '~/types/typesActi';

interface QuestionFormProps {
	activityId: number;
	questionToEdit?: Question;
	onSubmit: (question: Question) => void;
	onCancel?: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
	questionToEdit,
	onSubmit,
	onCancel,
}) => {
	const [questionText, setQuestionText] = useState(questionToEdit?.text ?? '');
	const [options, setOptions] = useState<Option[]>(
		questionToEdit?.options ??
			Array(4)
				.fill(null)
				.map(() => ({ id: crypto.randomUUID(), text: '' }))
	);
	const [correctOptionId, setCorrectOptionId] = useState(
		questionToEdit?.correctOptionId ?? ''
	);

	useEffect(() => {
		if (questionToEdit) {
			setQuestionText(questionToEdit.text);
			setOptions(questionToEdit.options);
			setCorrectOptionId(questionToEdit.correctOptionId);
		}
	}, [questionToEdit]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (questionText && options.length === 4 && correctOptionId) {
			const question: Question = {
				id: questionToEdit?.id ?? crypto.randomUUID(),
				text: questionText,
				options,
				correctOptionId,
			};
			onSubmit(question);
		}
	};

	const handleOptionChange = (id: string, text: string) => {
		setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
	};

	const handleAddOption = () => {
		if (options.length < 4) {
			setOptions([...options, { id: crypto.randomUUID(), text: '' }]);
		}
	};

	const handleRemoveOption = (id: string) => {
		if (options.length > 1) {
			setOptions(options.filter((opt) => opt.id !== id));
			if (correctOptionId === id) {
				setCorrectOptionId('');
			}
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6 rounded-lg bg-white p-6 shadow-md"
		>
			<div>
				<Label
					htmlFor="question"
					className="block text-lg font-medium text-gray-700"
				>
					Pregunta
				</Label>
				<textarea
					id="question"
					value={questionText}
					onChange={(e) => setQuestionText(e.target.value)}
					placeholder="Escribe tu pregunta aquí"
					required
					className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
			</div>
			<div className="space-y-4">
				<Label className="block text-lg font-medium text-gray-700">
					Opciones
				</Label>
				{options.map((option, index) => (
					<div key={option.id} className="flex items-center space-x-2">
						<input
							type="radio"
							name="correctOption"
							checked={correctOptionId === option.id}
							onChange={() => setCorrectOptionId(option.id)}
							required
							className="size-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
						/>
						<Input
							type="text"
							value={option.text}
							onChange={(e) => handleOptionChange(option.id, e.target.value)}
							placeholder={`Opción ${index + 1}`}
							required
							className="flex-1 rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						/>
						<Button
							type="button"
							onClick={() => handleRemoveOption(option.id)}
							variant="outline"
							size="icon"
							className="text-red-600 hover:text-red-800"
						>
							<X className="size-5" />
						</Button>
					</div>
				))}
				{options.length < 4 && (
					<Button
						type="button"
						onClick={handleAddOption}
						variant="outline"
						className="flex w-full items-center justify-center rounded-md border border-gray-300 p-2 text-indigo-600 shadow-sm hover:bg-indigo-50"
					>
						<Plus className="mr-2 size-5" /> Agregar opción
					</Button>
				)}
			</div>
			<div className="flex justify-end space-x-2">
				{onCancel && (
					<Button
						type="button"
						onClick={onCancel}
						variant="outline"
						className="horver:bg-gray-500 text-gray-100 hover:text-gray-800"
					>
						Cancelar
					</Button>
				)}
				<Button
					type="submit"
					className="bg-indigo-600 text-white hover:bg-indigo-700"
				>
					{questionToEdit ? 'Actualizar' : 'Crear'} Pregunta
				</Button>
			</div>
		</form>
	);
};

export default QuestionForm;
