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
	onCancel,
}) => {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [file1, setFile1] = useState<File | null>(null);
	const [file2, setFile2] = useState<File | null>(null);

	const [formData, setFormData] = useState<QuestionFilesSubida>({
		id: '',
		text: '',
		parametros: '',
		pesoPregunta: 0,
		archivoKey: '',
		portadaKey: '',
	});

	useEffect(() => {
		if (editingQuestion) {
			setFormData(editingQuestion);
		} else {
			setFormData({
				id: '',
				text: '',
				parametros: '',
				pesoPregunta: 0,
				archivoKey: '',
				portadaKey: '',
			});
		}
	}, [editingQuestion]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prevData) => ({
			...prevData,
			[name]: name === 'pesoPregunta' ? Number(value) : value,
		}));
	};

	const uploadToS3 = async (file: File): Promise<string> => {
		const res = await fetch('/api/upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contentType: file.type,
				fileSize: file.size,
				fileName: file.name,
			}),
		});
		if (!res.ok) throw new Error('Error al generar la URL de subida');

		const { url, fields, key } = await res.json();

		const uploadForm = new FormData();
		Object.entries(fields).forEach(([k, v]) =>
			uploadForm.append(k, v as string)
		);
		uploadForm.append('file', file);

		const uploadRes = await fetch(url, {
			method: 'POST',
			body: uploadForm,
		});
		if (!uploadRes.ok) throw new Error('Error al subir archivo');
		return key;
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
		}, 400);

		if (!editingQuestion) {
			formData.id = crypto.randomUUID();
		}

		try {
			if (!file1 || !file2)
				throw new Error('Debes seleccionar ambos archivos.');

			const archivoKey = await uploadToS3(file1);
			const portadaKey = await uploadToS3(file2);

			formData.archivoKey = archivoKey;
			formData.portadaKey = portadaKey;

			const response = await fetch('/api/educadores/question/archivos', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ activityId, questionsFilesSubida: formData }),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Error en la solicitud: ${errorText}`);
			}

			const data = await response.json();
			if (data.success) {
				toast('Pregunta guardada', {
					description: 'La pregunta se guardó correctamente',
				});
				window.location.reload();
			} else {
				toast('Error', {
					description: 'Error al guardar la pregunta',
				});
			}
		} catch (error) {
			console.error('Error al guardar la pregunta:', error);
			toast('Error', {
				description: `Error: ${(error as Error).message}`,
			});
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="container my-2 rounded-lg bg-white p-3 text-black shadow-lg">
			<h2 className="text-center text-2xl font-bold text-gray-800">
				{editingQuestion ? 'Actualizar' : 'Crear'} Pregunta del tipo:
				Presentación de trabajo
			</h2>
			<form onSubmit={handleSubmit}>
				<label>Pregunta</label>
				<textarea
					className="w-full rounded-lg border border-slate-400 p-2 outline-none"
					placeholder="Digite aquí la descripción del trabajo"
					name="text"
					value={formData.text}
					onChange={handleChange}
				/>

				<label>Criterios de evaluación</label>
				<textarea
					className="w-full rounded-lg border border-slate-400 p-2 outline-none"
					placeholder="Parámetros de evaluación"
					name="parametros"
					value={formData.parametros}
					onChange={handleChange}
				/>

				{/* Archivo de ayuda (documento, video, etc.) */}
				<div className="mb-4">
					<label className="mb-2 block font-semibold text-gray-700">
						Archivo de ayuda
					</label>
					<div className="relative flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm">
						<span className="truncate text-sm text-gray-500">
							{file1?.name ||
								'Selecciona un archivo de ayuda (PDF, Word, video...)'}
						</span>
						<label className="cursor-pointer rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
							Seleccionar
							<input
								type="file"
								accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,application/*"
								required={!editingQuestion}
								onChange={(e) => setFile1(e.target.files?.[0] || null)}
								className="hidden"
							/>
						</label>
					</div>
				</div>

				{/* Imagen complementaria */}
				<div className="mb-6">
					<label className="mb-2 block font-semibold text-gray-700">
						Recurso complementario (imagen)
					</label>
					<div className="relative flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm">
						<span className="truncate text-sm text-gray-500">
							{file2?.name || 'Selecciona una imagen complementaria'}
						</span>
						<label className="cursor-pointer rounded-md bg-purple-500 px-3 py-1 text-sm text-white hover:bg-purple-600">
							Seleccionar
							<input
								type="file"
								accept="image/*"
								required={!editingQuestion}
								onChange={(e) => setFile2(e.target.files?.[0] || null)}
								className="hidden"
							/>
						</label>
					</div>
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
					{editingQuestion && (
						<Button
							type="button"
							variant="outline"
							className="text-gray-100 hover:text-gray-800"
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
	);
};

export default FormActCompletado;
