'use client';
import { useState, useEffect } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Progress } from '~/components/educators/ui/progress';

import type { QuestionFilesSubida } from '~/types/typesActi';

// Interfaz para la subida de preguntas tipo completado
interface formSubida {
	activityId: number;
	editingQuestion?: QuestionFilesSubida;
	onSubmit?: () => void;
	onCancel?: () => void;
}

const FormActCompletado: React.FC<formSubida> = ({
	activityId,
	editingQuestion,
	onSubmit,
	onCancel,
}) => {
	const [isUploading, setIsUploading] = useState<boolean>(false); // Estado para el estado de carga
	const [uploadProgress, setUploadProgress] = useState<number>(0); // Estado para el progreso de carga
	const [formData, setFormData] = useState<QuestionFilesSubida>({
		id: '',
		text: '',
		parametros: '',
		pesoPregunta: 0, // ✅
	}); // Estado para los datos del formulario

	// Efecto para cargar los datos de la pregunta
	useEffect(() => {
		if (editingQuestion) {
			setFormData(editingQuestion);
		} else {
			setFormData({
				id: '',
				text: '',
				parametros: '',
				pesoPregunta: 0, // ✅
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
			[name]: name === 'pesoPregunta' ? Number(value) : value,
		}));
	};

	// Maneja el envio del formulario para guardar la pregunta
	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
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

		if (!editingQuestion) {
			formData.id = crypto.randomUUID();
		}

		try {
			const response = await fetch('/api/educadores/question/archivos', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ activityId, questionsFilesSubida: formData }),
			});
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Error en la solicitud: ${errorText}`);
			}
			const data = (await response.json()) as {
				success: boolean;
				questionsFilesSubida: QuestionFilesSubida[];
			};
			if (data.success) {
				toast('Pregunta guardada', {
					description: 'La pregunta se guardó correctamente',
				});
				onSubmit?.();
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
			setIsUploading(false);
		}
	};

	// Retorno la vista del componente
	return (
		<>
			<div className="container my-2 rounded-lg bg-white p-3 text-black shadow-lg">
				<h2 className="text-center text-2xl font-bold text-gray-800">
					{editingQuestion ? 'Actualizar' : 'Crear'} Pregunta del tipo:
					Presentacion de trabajo
				</h2>
				<form onSubmit={handleSubmit}>
					<label>Pregunta</label>

					<textarea
						className="w-full rounded-lg border border-slate-400 p-2 outline-none"
						placeholder="Digite aqui en esta seccion el trabajo a subir"
						name="text"
						value={formData.text}
						onChange={handleChange}
					/>
					<label className="mb-1 block text-sm font-medium text-gray-700">
						Peso de la pregunta (%)
					</label>
					<input
						type="number"
						name="pesoPregunta"
						value={formData.pesoPregunta}
						onChange={handleChange}
						min={0}
						max={100}
						step={1}
						required
						className="mb-4 w-full rounded-lg border border-slate-400 p-2 outline-none"
					/>

					<label>Parametros de evaluacion</label>
					<textarea
						className="w-full rounded-lg border border-slate-400 p-2 outline-none"
						placeholder="Diguite en esta seccion los parametros que tendra para en cuenta para la calificacion"
						name="parametros"
						value={formData.parametros}
						onChange={handleChange}
					/>
					{isUploading && (
						<div className="my-1">
							<Progress value={uploadProgress} className="w-full" />
							<p className="mt-2 text-center text-sm text-gray-500">
								{uploadProgress}% Completado
							</p>
						</div>
					)}
					<div className="flex justify-end space-x-2">
						{editingQuestion && (
							<Button
								type="button"
								variant="outline"
								className="horver:bg-gray-500 text-gray-100 hover:text-gray-800"
								onClick={onCancel}
							>
								Cancelar
							</Button>
						)}
						<Button
							type="submit"
							className="border-none bg-green-400 text-white hover:bg-green-500"
						>
							{editingQuestion ? 'Actualizar' : 'Enviar'}
						</Button>
					</div>
				</form>
			</div>
		</>
	);
};

export default FormActCompletado;
