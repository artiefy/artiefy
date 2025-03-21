'use client';
import { useState, useEffect } from 'react';

import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';

import type { Question, OptionOM } from '~/types/typesActi';

//La validacion del porcentaje no se encuentra implementada

// Propiedades del componente para el formulario de preguntas
interface QuestionFormProps {
	activityId: number;
	editingQuestion?: Question;
	onSubmit: (questions: Question) => void;
	onCancel?: () => void;
	isUploading: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
	activityId,
	editingQuestion,
	onSubmit,
	onCancel,
	isUploading,
}) => {
	const [questionText, setQuestionText] = useState(editingQuestion?.text ?? ''); // Estado para el texto de la pregunta
	const [options, setOptions] = useState<OptionOM[]>(
		editingQuestion?.options ??
			Array(4)
				.fill(null)
				.map(() => ({ id: crypto.randomUUID(), text: '' }))
	); // Estado para las opciones de la pregunta
	const [correctOptionId, setCorrectOptionId] = useState(
		editingQuestion?.correctOptionId ?? ''
	); // Estado para la opción correcta de la pregunta
	const [pesoPregunta, setPesoPregunta] = useState<number>(
		editingQuestion?.pesoPregunta ?? 0
	); // Estado para el peso de la pregunta
	const [isUploading2, setIsUploading] = useState(false); // Estado para el estado de carga
	const [uploadProgress, setUploadProgress] = useState(0); // Estado para el progreso de carga
	const [isVisible, setIsVisible] = useState<boolean>(true); // Estado para la visibilidad del formulario

	// Efecto para cargar los datos de la pregunta
	useEffect(() => {
		if (editingQuestion) {
			setQuestionText(editingQuestion.text);
			setOptions(editingQuestion.options ?? []);
			setCorrectOptionId(editingQuestion.correctOptionId);
		} else {
			setQuestionText('');
			setOptions(
				Array(4)
					.fill(null)
					.map(() => ({ id: crypto.randomUUID(), text: '' }))
			);
			setCorrectOptionId('');
		}
	}, [editingQuestion]);

	// Validar el porcentaje total de las preguntas
	const validateTotalPercentage = async (newPesoPregunta: number) => {
		const response = await fetch(
			`/api/educadores/question/totalPercentage?activityId=${activityId}`
		);
		const data = (await response.json()) as { totalPercentage: number };
		const totalPercentage =
			data.totalPercentage +
			newPesoPregunta -
			(editingQuestion?.pesoPregunta ?? 0);
		return totalPercentage > 100;
	};

	// Maneja el envio del formulario para guardar la pregunta
	const handleSubmit = async (questions: Question) => {
		if (await validateTotalPercentage(pesoPregunta)) {
			toast('Error', {
				description:
					'El porcentaje total de las preguntas no puede exceder el 100%',
			});
			setIsUploading(false);
			return;
		}
		const method = editingQuestion ? 'PUT' : 'POST';
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
				toast('Pregunta guardada', {
					description: 'La pregunta se guardó correctamente',
				});
				onSubmit(questions);
			} else {
				toast('Error', {
					description: data.message ?? 'Error al guardar la pregunta',
				});
			}
		} catch (error) {
			console.error('Error al guardar la pregunta:', error);
			toast('Error', {
				description: `Error al guardar la pregunta: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		} finally {
			setIsUploading(false);
		}
	};

	// Maneja el cambio de una opción
	const handleOptionChange = (id: string, text: string) => {
		setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
	};

	// Maneja la adición de una opción
	const handleAddOption = () => {
		if (options.length < 4) {
			setOptions([...options, { id: crypto.randomUUID(), text: '' }]);
		}
	};

	// Maneja la eliminación de una opción
	const handleRemoveOption = (id: string) => {
		if (options.length > 1) {
			setOptions(options.filter((opt) => opt.id !== id));
			if (correctOptionId === id) {
				setCorrectOptionId('');
			}
		}
	};

	// Efecto para actualizar el progreso de carga
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

	// Maneja la cancelación del formulario
	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
		setIsVisible(false);
	};

	// Retorno la vista del componente
	if (!isVisible) {
		return null;
	}

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				await handleSubmit({
					id: editingQuestion?.id ?? crypto.randomUUID(),
					text: questionText,
					options: options.map((opt) => ({
						...opt,
						id: opt.id || crypto.randomUUID(),
					})),
					correctOptionId,
					pesoPregunta: pesoPregunta,
				});
			}}
			className="space-y-6 rounded-lg bg-white p-6 shadow-md"
		>
			<div className="flex-col space-y-4 md:flex md:flex-row md:space-x-4">
				<div className="w-full md:w-3/4">
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
						className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm outline-none"
					/>
				</div>
				<div className="w-11/12 md:w-1/4">
					<Label
						htmlFor="pesoPregunta"
						className="block text-lg font-medium text-gray-700"
					>
						Porcentaje de la pregunta
					</Label>
					<input
						type="number"
						id="pesoPregunta"
						value={pesoPregunta}
						onChange={(e) => setPesoPregunta(Number(e.target.value))}
						min={1}
						max={100}
						required
						className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm outline-none"
					/>
				</div>
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
					{editingQuestion ? 'Actualizar' : 'Crear'} Pregunta
				</Button>
			</div>
		</form>
	);
};

export default QuestionForm;
