'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';
import type { Completado } from '~/types/typesActi';

//La validacion del porcentaje no se encuentra implementada

// Propiedades del componente para las preguntas abiertas
interface PreguntasAbiertasProps {
	activityId: number;
	editingQuestion?: Completado;
	onSubmit: (question: Completado) => void;
	onCancel?: () => void;
	isUploading: boolean;
}

const PreguntasAbiertas: React.FC<PreguntasAbiertasProps> = ({
	activityId,
	editingQuestion,
	onSubmit,
	onCancel,
	isUploading,
}) => {
	const [formData, setFormData] = useState<Completado>({
		id: '',
		text: '',
		correctAnswer: '',
		answer: '',
		pesoPregunta: 0,
	}); // Estado para los datos del formulario
	const [uploadProgress, setUploadProgress] = useState<number>(0); // Estado para el progreso de carga
	const [isVisible, setIsVisible] = useState<boolean>(true); // Estado para la visibilidad del formulario

	// Efecto para cargar los datos de la pregunta
	useEffect(() => {
		if (editingQuestion) {
			setFormData(editingQuestion);
		} else {
			setFormData({
				id: '',
				text: '',
				correctAnswer: '',
				answer: '',
				pesoPregunta: 0,
			});
		}
	}, [editingQuestion]);

	// Maneja el cambio en los campos del formulario
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};

	// Valida que el porcentaje total de las preguntas no sea mayor a 100% 'No finalizado'
	const validateTotalPercentage = async (newPesoPregunta: number) => {
		const response = await fetch(
			`/api/educadores/question/totalPercentage?activityId=${activityId}`
		);
		const data = (await response.json()) as { totalPercentage: number };
		const totalPercentage =
			data.totalPercentage +
			newPesoPregunta -
			(editingQuestion?.pesoPregunta ?? 0);
		return totalPercentage <= 100;
	};

	// Maneja el envio del formulario para guardar la pregunta
	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!(await validateTotalPercentage(formData.pesoPregunta))) {
			toast('Error', {
				description:
					'El porcentaje total de las preguntas no puede ser mayor a 100%',
			});
			return;
		}
		setIsVisible(false);
		const method = editingQuestion ? 'PUT' : 'POST';
		const questionId = editingQuestion
			? editingQuestion.id
			: crypto.randomUUID();
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
			const response = await fetch('/api/educadores/question/completar', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					activityId,
					questionsACompletar: { ...formData, id: questionId },
				}),
			});
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Error en la solicitud: ${errorText}`);
			}
			const data = (await response.json()) as {
				success: boolean;
				questions: Completado[];
			};
			if (data.success) {
				toast('Pregunta guardada', {
					description: 'La pregunta se guardó correctamente',
				});
				onSubmit({ ...formData, id: questionId });
			} else if (data.success === false) {
				toast('Error', {
					description: 'Error al guardar la pregunta',
				});
			}
		} catch (error) {
			console.error('Error al guardar la pregunta:', error);
			toast('Error', {
				description: `Error al guardar la pregunta: ${(error as Error).message}`,
			});
		} finally {
			clearInterval(interval);
		}
	};

	// Maneja el cancelar la edición de la pregunta
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

	// Retorno la vista del componente
	return (
		<>
			<div className="container my-2 rounded-lg bg-white p-3 text-black shadow-lg">
				<form onSubmit={handleSubmit}>
					<div className="flex-col space-y-4 md:flex md:flex-row md:space-x-4">
						<div className="w-full md:w-3/4">
							<Label
								htmlFor="text"
								className="block text-lg font-medium text-gray-700"
							>
								Pregunta
							</Label>
							<textarea
								id="text"
								name="text"
								value={formData.text}
								onChange={handleChange}
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
								name="pesoPregunta"
								value={formData.pesoPregunta}
								onChange={handleChange}
								min={1}
								max={100}
								required
								className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm outline-none"
							/>
						</div>
					</div>
					<Label
						htmlFor="correctAnswer"
						className="block text-lg font-medium text-gray-700"
					>
						Palabra de completado
					</Label>
					<Input
						id="correctAnswer"
						name="correctAnswer"
						value={formData.correctAnswer}
						onChange={handleChange}
						placeholder="Digite aquí la palabra de completado"
						className="w-full rounded-lg border border-slate-400 p-2 outline-none"
					/>
					{isUploading && (
						<div className="my-1">
							<Progress value={uploadProgress} className="w-full" />
							<p className="mt-2 text-center text-sm text-gray-500">
								{uploadProgress}% Completado
							</p>
						</div>
					)}
					<div className="mt-3 flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							className="horver:bg-gray-500 text-gray-100 hover:text-gray-800"
							onClick={handleCancel}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							className="border-none bg-green-400 text-white hover:bg-green-500"
						>
							Enviar
						</Button>
					</div>
				</form>
			</div>
		</>
	);
};

export default PreguntasAbiertas;
