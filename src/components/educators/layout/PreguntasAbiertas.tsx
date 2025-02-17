'use client';
import { useState, useEffect } from 'react';
import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Progress } from '~/components/educators/ui/progress';
import { toast } from '~/hooks/use-toast';
import type { Completado } from '~/types/typesActi';

interface PreguntasAbiertasProps {
	activityId: number;
	questionToEdit?: Completado;
	onSubmit: (question: Completado) => void;
	onCancel?: () => void;
	isUploading: boolean;
}

const PreguntasAbiertas: React.FC<PreguntasAbiertasProps> = ({
	activityId,
	questionToEdit,
	onSubmit,
	onCancel,
	isUploading,
}) => {
	const [formData, setFormData] = useState<Completado>({
		id: '',
		text: '',
		palabra: '',
	});
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [isVisible, setIsVisible] = useState<boolean>(true);

	useEffect(() => {
		if (questionToEdit) {
			setFormData(questionToEdit);
		} else {
			setFormData({
				id: '',
				text: '',
				palabra: '',
			});
		}
	}, [questionToEdit]);

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
		const method = questionToEdit ? 'PUT' : 'POST';
		const questionId = questionToEdit ? questionToEdit.id : crypto.randomUUID();
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
				toast({
					title: 'Pregunta guardada',
					description: 'La pregunta se guardó correctamente',
					variant: 'default',
				});
				onSubmit({ ...formData, id: questionId });
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
			clearInterval(interval);
		}
	};

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
		<>
			<div className="container my-2 rounded-lg bg-white p-3 text-black shadow-lg">
				<form onSubmit={handleSubmit}>
					<label>Pregunta</label>
					<textarea
						className="w-full rounded-lg border border-slate-400 p-2 outline-none"
						placeholder="Digite aquí la pregunta"
						name="text"
						value={formData.text}
						onChange={handleChange}
					/>
					<label>Palabra de completado</label>
					<Input
						className="w-full rounded-lg border border-slate-400 p-2 outline-none"
						placeholder="Digite aquí la palabra de completado"
						name="palabra"
						value={formData.palabra}
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
