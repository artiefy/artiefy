'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/educators/ui/button';
import { Progress } from '~/components/educators/ui/progress';
import type { QuestionFilesSubida } from '~/types/typesActi';

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
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [formData, setFormData] = useState<QuestionFilesSubida>({
		id: '',
		text: '',
		parametros: '',
	});

	useEffect(() => {
		if (editingQuestion) {
			setFormData(editingQuestion);
		} else {
			setFormData({
				id: '',
				text: '',
				parametros: '',
			});
		}
	}, [editingQuestion]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prevData) => ({
			...prevData,
			[name]: name === 'pesoNota' ? Number(value) : value,
		}));
	};

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
