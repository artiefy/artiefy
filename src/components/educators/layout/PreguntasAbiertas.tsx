'use client';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';

import type { Completado } from '~/types/typesActi';

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
	const router = useRouter();

	const [formData, setFormData] = useState<Completado>({
		id: '',
		text: '',
		correctAnswer: '',
		answer: '',
		pesoPregunta: 0,
	});

	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [isVisible, setIsVisible] = useState<boolean>(true);

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

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
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
		}, 300);

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
				toast.success('✅ Pregunta guardada correctamente');
				onSubmit({ ...formData, id: questionId });
				router.refresh(); // 🔁 Recarga la página entera
			} else {
				toast.error('❌ No se pudo guardar la pregunta.');
			}
		} catch (error) {
			console.error('Error al guardar la pregunta:', error);
			toast.error(`❌ Error: ${(error as Error).message}`);
		} finally {
			clearInterval(interval);
		}
	};

	const handleCancel = () => {
		if (onCancel) onCancel();
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className="container my-4 max-w-4xl rounded-lg bg-white p-6 shadow-md">
			<form onSubmit={handleSubmit} className="space-y-6">
				<h2 className="text-xl font-bold text-gray-700">
					{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta de Completado'}
				</h2>

				<div>
					<Label htmlFor="text">Texto de la Pregunta</Label>
					<textarea
						id="text"
						name="text"
						value={formData.text}
						onChange={handleChange}
						placeholder="Escribe la pregunta aquí..."
						required
						className="mt-1 w-full rounded-md border border-gray-300 p-2 shadow-sm outline-none"
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label htmlFor="correctAnswer">Palabra que completa</Label>
						<Input
							id="correctAnswer"
							name="correctAnswer"
							value={formData.correctAnswer}
							onChange={handleChange}
							placeholder="Ejemplo: revolución"
							required
							className="mt-1 w-full"
						/>
					</div>

					<div>
						<Label htmlFor="pesoPregunta">Porcentaje de la Pregunta</Label>
						<Input
							type="number"
							id="pesoPregunta"
							name="pesoPregunta"
							value={formData.pesoPregunta}
							onChange={handleChange}
							min={1}
							max={100}
							required
							className="mt-1 w-full"
						/>
					</div>
				</div>

				{isUploading && (
					<div>
						<Progress value={uploadProgress} className="w-full" />
						<p className="mt-2 text-center text-sm text-gray-500">
							{uploadProgress}% subido
						</p>
					</div>
				)}

				<div className="mt-4 flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						className="border-gray-400 text-gray-700 hover:bg-gray-100"
						onClick={handleCancel}
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						className="bg-green-600 text-white hover:bg-green-700"
					>
						{editingQuestion ? 'Actualizar' : 'Guardar'}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default PreguntasAbiertas;
