'use client';
import { useState, useEffect } from 'react';
import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Progress } from '~/components/educators/ui/progress';
import { toast } from '~/hooks/use-toast';
import type { QuestionFilesSubida } from '~/types/typesActi';

interface formSubida {
	activityId: number;
	editingQuestion?: QuestionFilesSubida;
	onSubmit: (pesoNota: number) => void;
}

const FormActCompletado: React.FC<formSubida> = ({
	activityId,
	editingQuestion,
	onSubmit,
}) => {
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [formData, setFormData] = useState<QuestionFilesSubida>({
		id: '',
		text: '',
		parametros: '',
		pesoNota: 0,
	});

	useEffect(() => {
		if (editingQuestion) {
			setFormData(editingQuestion);
		} else {
			setFormData({
				id: '',
				text: '',
				parametros: '',
				pesoNota: 0,
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
				toast({
					title: 'Pregunta guardada',
					description: 'La pregunta se guardó correctamente',
					variant: 'default',
				});
				onSubmit(formData.pesoNota);
			} else if (data.success === false) {
				toast({
					title: 'Error',
					description: 'Error al guardar la pregunta',
					variant: 'destructive',
				});
			}
		} catch (error) {
			console.error('Error al guardar la pregunta:', error);
			toast({
				title: 'Error',
				description: `Error al guardar la pregunta: ${(error as Error).message}`,
				variant: 'destructive',
			});
		} finally {
			setIsUploading(false);
		}
	};
	return (
		<>
			<div className="container my-2 rounded-lg bg-white p-3 text-black shadow-lg">
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
					<div className="flex flex-col text-black">
						<label>Peso de la pregunta (en porcentaje %)</label>
						<Input
							className={`w-1/4 rounded-lg border border-slate-400 bg-transparent p-2 shadow-2xl outline-none md:w-1/12 lg:w-1/12`}
							type="number"
							id="percentage"
							name="pesoNota"
							min="0"
							max="100"
							step="1"
							placeholder="0-100"
							value={formData.pesoNota}
							onChange={handleChange}
						/>
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
							variant="outline"
							className="horver:bg-gray-500 text-gray-100 hover:text-gray-800"
							onClick={() => onSubmit(formData.pesoNota)}
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

export default FormActCompletado;
