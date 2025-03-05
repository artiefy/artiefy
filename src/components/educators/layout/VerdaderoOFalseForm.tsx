'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/educators/ui/button';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';
import type { VerdaderoOFlaso, OptionVOF } from '~/types/typesActi';

interface QuestionFormProps {
	activityId: number;
	questionToEdit?: VerdaderoOFlaso;
	onSubmit: (question: VerdaderoOFlaso) => void;
	onCancel?: () => void;
	isUploading: boolean;
}

const QuestionVOFForm: React.FC<QuestionFormProps> = ({
	activityId,
	questionToEdit,
	onSubmit,
	onCancel,
	isUploading,
}) => {
	const [questionText, setQuestionText] = useState(questionToEdit?.text ?? '');
	const [options, setOptions] = useState<OptionVOF[]>([
		{ id: 'true', text: 'Verdadero' },
		{ id: 'false', text: 'Falso' },
	]);
	const [correctOptionId, setCorrectOptionId] = useState(
		questionToEdit?.correctOptionId ?? ''
	);
	const [isUploading2, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isVisible, setIsVisible] = useState<boolean>(true);

	useEffect(() => {
		if (questionToEdit) {
			setQuestionText(questionToEdit.text);
			setOptions([
				{ id: 'true', text: 'Verdadero' },
				{ id: 'false', text: 'Falso' },
			]);
			setCorrectOptionId(questionToEdit.correctOptionId);
		} else {
			setQuestionText('');
			setOptions([
				{ id: 'true', text: 'Verdadero' },
				{ id: 'false', text: 'Falso' },
			]);
			setCorrectOptionId('');
		}
	}, [questionToEdit]);

	const handleSubmit = async (question: VerdaderoOFlaso) => {
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
			const response = await fetch('/api/educadores/question/VerdaderoOFalso', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ activityId, questionsVOF: question }),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Error en la solicitud: ${errorText}`);
			}

			const data = (await response.json()) as {
				success: boolean;
				questions: VerdaderoOFlaso[];
			};

			if (data.success) {
				toast('Pregunta guardada', {
					description: 'La pregunta se guardó correctamente',
				});
				onSubmit(question);
			} else if (data.success === false) {
				toast('Error', {
					description: 'Error al guardar la pregunta',
				});
			}
		} catch (error: unknown) {
			console.error('Error al guardar la pregunta:', error);
			toast('Error', {
				description: `Error al guardar la pregunta: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		} finally {
			setIsUploading(false);
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
					correctOptionId,
					options,
					correct: correctOptionId === 'true',
				});
			}}
			className="space-y-6 rounded-lg bg-white p-6 shadow-md"
		>
			<div>
				<Label
					htmlFor="question"
					className="block text-lg font-medium text-gray-700"
				>
					Pregunta tipo verdadera o falso
				</Label>
				<textarea
					id="question"
					value={questionText}
					onChange={(e) => setQuestionText(e.target.value)}
					placeholder="Escribe tu pregunta aquí"
					required
					className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm outline-none"
				/>
			</div>
			<div className="space-y-4">
				<Label className="block text-lg font-medium text-gray-700">
					Opciones
				</Label>
				{options.map((option) => (
					<div key={option.id} className="flex items-center space-x-2">
						<input
							type="radio"
							name="correctOption"
							checked={correctOptionId === option.id}
							onChange={() => setCorrectOptionId(option.id)}
							required
							className="size-4 border-gray-300"
						/>
						<Label className="flex-1 text-black">{option.text}</Label>
					</div>
				))}
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

export default QuestionVOFForm;
