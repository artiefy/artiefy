'use client';

import { useState, useEffect } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';

import type { VerdaderoOFlaso, OptionVOF } from '~/types/typesActi';

//La validacion del porcentaje no se encuentra implementada

// Propiedades del componente para el formulario de preguntas Verdadero o Falso
interface QuestionFormProps {
	activityId: number;
	editingQuestion?: VerdaderoOFlaso;
	onSubmit: (question: VerdaderoOFlaso) => void;
	onCancel?: () => void;
	isUploading: boolean;
}

const QuestionVOFForm: React.FC<QuestionFormProps> = ({
	activityId,
	editingQuestion,
	onSubmit,
	onCancel,
	isUploading,
}) => {
	const [questionText, setQuestionText] = useState(editingQuestion?.text ?? ''); // Estado para el texto de la pregunta
	const [options, setOptions] = useState<OptionVOF[]>([
		{ id: 'true', text: 'Verdadero' },
		{ id: 'false', text: 'Falso' },
	]); // Estado para las opciones de la pregunta
	const [pesoPregunta, setPesoPregunta] = useState<number>(
		editingQuestion?.pesoPregunta ?? 0
	); // Estado para el peso de la pregunta
	const [correctOptionId, setCorrectOptionId] = useState(
		editingQuestion?.correctOptionId ?? ''
	); // Estado para la opción correcta de la pregunta
	const [isUploading2, setIsUploading] = useState(false); // Estado para el estado de carga
	const [uploadProgress, setUploadProgress] = useState(0); // Estado para el progreso de carga
	const [isVisible, setIsVisible] = useState<boolean>(true); // Estado para la visibilidad del formulario

	// Efecto para cargar los datos de la pregunta
	useEffect(() => {
		if (editingQuestion) {
			setQuestionText(editingQuestion.text);
			setOptions([
				{ id: 'true', text: 'Verdadero' },
				{ id: 'false', text: 'Falso' },
			]);
			setCorrectOptionId(editingQuestion.correctOptionId);
		} else {
			setQuestionText('');
			setOptions([
				{ id: 'true', text: 'Verdadero' },
				{ id: 'false', text: 'Falso' },
			]);
			setCorrectOptionId('');
		}
	}, [editingQuestion]);

	// Función para validar el porcentaje total de las preguntas
	// Función para validar el porcentaje total de las preguntas
	// Función para validar el porcentaje total de las preguntas
const validateTotalPercentage = async (newPesoPregunta: number) => {
	const response = await fetch(
		`/api/educadores/question/totalPercentage?activityId=${activityId}`
	);
	const data = (await response.json()) as { totalPercentage: number | string };

	// 🔧 Asegúrate de convertir todo a número
	const totalActual = Number(data.totalPercentage);
	const pesoNuevo = Number(newPesoPregunta);
	const pesoAnterior = Number(editingQuestion?.pesoPregunta ?? 0);

	const totalWithNew = totalActual + pesoNuevo - pesoAnterior;

	console.log('Total actual:', totalActual);
	console.log('Peso nuevo:', pesoNuevo);
	console.log('Peso anterior (si aplica):', pesoAnterior);
	console.log('Nuevo total proyectado:', totalWithNew);

	return totalWithNew > 100;
};


	// Función para manejar el envio del formulario
	const handleSubmit = async (question: VerdaderoOFlaso) => {
		const excedeLimite = await validateTotalPercentage(pesoPregunta);
		if (excedeLimite) {
			toast('Error', {
				description:
					'El porcentaje total de las preguntas no puede exceder el 100%',
			});
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

	// Efecto para manejar el progreso de carga
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

	// Función para manejar la cancelación del formulario
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
					correctOptionId,
					options,
					correct: correctOptionId === 'true',
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
					{editingQuestion ? 'Actualizar' : 'Crear'} Pregunta
				</Button>
			</div>
		</form>
	);
};

export default QuestionVOFForm;
