'use client';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';
import type { Question, OptionOM } from '~/types/typesActi';

interface QuestionFormProps {
	activityId: number;
	questionToEdit?: Question;
	onSubmit: (questions: Question) => void;
	onCancel?: () => void;
	isUploading: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
	activityId,
	questionToEdit,
	onSubmit,
	onCancel,
	isUploading,
}) => {
	const [questionText, setQuestionText] = useState(questionToEdit?.text ?? '');
	const [options, setOptions] = useState<OptionOM[]>(
		questionToEdit?.options ??
			Array(4)
				.fill(null)
				.map(() => ({ id: crypto.randomUUID(), text: '' }))
	);
	const [correctOptionId, setCorrectOptionId] = useState(
		questionToEdit?.correctOptionId ?? ''
	);
	const [isUploading2, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isVisible, setIsVisible] = useState<boolean>(true);

	useEffect(() => {
		if (questionToEdit) {
			setQuestionText(questionToEdit.text);
			setOptions(questionToEdit.options ?? []);
			setCorrectOptionId(questionToEdit.correctOptionId);
		} else {
			setQuestionText('');
			setOptions(
				Array(4)
					.fill(null)
					.map(() => ({ id: crypto.randomUUID(), text: '' }))
			);
			setCorrectOptionId('');
		}
	}, [questionToEdit]);

	const handleSubmit = async (questions: Question) => {
		const method = questionToEdit ? 'PUT' : 'POST';
		setIsUploading(true);
		setUploadProgress(0);
		const interval = setInterval(() => {
			setUploadProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					return 100;
				}
				return prev + 10;
			});
		}, 500);

		try {
			const response = await fetch('/api/educadores/question/opcionMulti', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					activityId,
					questionsOM: { ...questions },
				}),
			});
			const data = (await response.json()) as {
				message?: string;
				success: boolean;
			};
			if (response.ok && data.success) {
				toast('Pregunta guardada',{
					description: 'La pregunta se guardó correctamente',
				});
				onSubmit(questions);
			} else {
				toast( 'Error',{
					description: data.message ?? 'Error al guardar la pregunta',
				});
			}
		} catch (error) {
			console.error('Error al guardar la pregunta:', error);
			toast('Error',{
				description: `Error al guardar la pregunta: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		} finally {
			setIsUploading(false);
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

	useEffect(() => {
		if (isUploading2) {
			setUploadProgress(0);
			const interval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev >= 100) {
						clearInterval(interval);
						return 100;
					}
					return prev + 10; // Incrementar de 10 en 10
				});
			}, 500);

			return () => clearInterval(interval);
		}
	}, [isUploading2]);

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
		setIsVisible(false);
	};

	if (!isVisible) {
		return null;
	}

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				await handleSubmit({
					id: questionToEdit?.id ?? crypto.randomUUID(),
					text: questionText,
					options: options.map((opt) => ({
						...opt,
						id: opt.id || crypto.randomUUID(),
					})),
					correctOptionId,
				});
			}}
			className="space-y-6 rounded-lg bg-white p-6 shadow-md"
		>
			<div>
				<Label
					htmlFor="questions"
					className="block text-lg font-medium text-gray-700"
				>
					Pregunta
				</Label>
				<textarea
					id="questions"
					value={questionText}
					onChange={(e) => setQuestionText(e.target.value)}
					placeholder="Escribe tu pregunta aquí"
					required
					className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm outline-none focus:border-indigo-500 focus:ring-indigo-500"
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
							className="flex-1 rounded-md border border-gray-300 p-2 text-black shadow-sm"
						/>
						<Button
							type="button"
							onClick={() => handleRemoveOption(option.id)}
							variant="outline"
							size="icon"
							className="text-white hover:text-red-500"
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
						className="mx-auto flex w-2/5 items-center justify-center rounded-md border border-gray-300 bg-slate-100 p-2 text-black shadow-sm hover:bg-indigo-50"
					>
						<Plus className="mr-2 size-5" /> Agregar opción
					</Button>
				)}
			</div>
			{isUploading && (
				<div className="my-1">
					<Progress value={uploadProgress} className="w-full" />
					<p className="mt-2 text-center text-sm text-gray-500">
						{uploadProgress}% Completado
					</p>
				</div>
			)}
			<div className="flex justify-end space-x-2">
				<Button
					type="button"
					onClick={handleCancel}
					variant="outline"
					className="text-gray-100 hover:text-gray-800"
				>
					Cancelar
				</Button>

				<Button
					type="submit"
					className="border-none bg-green-400 text-white hover:bg-green-500"
				>
					{questionToEdit ? 'Actualizar' : 'Crear'} Pregunta
				</Button>
			</div>
		</form>
	);
};

export default QuestionForm;
