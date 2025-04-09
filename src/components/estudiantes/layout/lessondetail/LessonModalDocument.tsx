import { useState } from 'react';

import { FileCheck2, FileUp } from 'lucide-react';
import { BiSolidReport } from 'react-icons/bi';
import { FaTrophy } from 'react-icons/fa';
import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';

import type { Activity } from '~/types';

interface DocumentModalProps {
	isOpen: boolean;
	onClose: () => void;
	activity: Activity;
	userId: string;
	isLastActivity: boolean;
	isLastLesson: boolean;
	onViewHistory: () => void;
	onActivityComplete: () => void;
}

export function LessonModalDocument({
	isOpen,
	onClose,
	activity,
	userId,
	isLastActivity,
	isLastLesson,
	onViewHistory,
	onActivityComplete,
}: DocumentModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			setFile(e.target.files[0]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			toast.error('Por favor selecciona un archivo');
			return;
		}

		setIsUploading(true);
		const formData = new FormData();
		formData.append('file', file);
		formData.append('userId', userId);
		formData.append('activityId', activity.id.toString());
		formData.append(
			'questionId',
			activity.content?.questionsFilesSubida?.[0]?.id ?? ''
		);

		try {
			const response = await fetch('/api/activities/uploadFile', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Error al subir el archivo');
			}

			await response.json();
			setIsSubmitted(true);
			toast.success('Documento subido correctamente. Pendiente de revisión.');

			if (isLastActivity && isLastLesson) {
				onActivityComplete();
			}
		} catch (error) {
			toast.error('Error al subir el archivo');
			console.error('Error:', error);
		} finally {
			setIsUploading(false);
		}
	};

	const renderActionButtons = () => {
		if (isLastActivity && isLastLesson && isSubmitted) {
			return (
				<div className="space-y-3">
					<Button
						onClick={onViewHistory}
						className="w-full bg-blue-500 text-white hover:bg-blue-600"
					>
						<span className="flex items-center justify-center gap-2">
							<FaTrophy className="mr-1" />
							Ver Reporte de Calificaciones
							<BiSolidReport className="ml-1 h-8" />
						</span>
					</Button>
					<Button onClick={onClose} className="w-full bg-[#00BDD8] text-white">
						Cerrar
					</Button>
				</div>
			);
		}

		return (
			<Button onClick={onClose} className="w-full bg-blue-500 text-white">
				Cerrar
			</Button>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader className="relative pb-6">
					<DialogTitle className="text-center text-3xl font-bold">
						SUBIR DOCUMENTO
						<div className="absolute top-0 right-4">
							{isSubmitted ? (
								<FileCheck2 className="size-8 text-green-500" />
							) : (
								<FileUp className="size-8 text-blue-500" />
							)}
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					<div className="rounded-lg border border-gray-200 bg-white p-6">
						<h3 className="mb-6 text-xl font-semibold text-gray-900">
							Instrucciones
						</h3>
						<p className="mb-8 text-gray-700">
							{activity.content?.questionsFilesSubida?.[0]?.text}
						</p>

						{!isSubmitted ? (
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-4">
									<input
										type="file"
										onChange={handleFileChange}
										className="w-full cursor-pointer rounded-lg border border-gray-300 p-2"
										disabled={isUploading}
									/>
									<Button
										type="submit"
										disabled={!file || isUploading}
										className="bg-primary w-full"
									>
										{isUploading ? (
											<>
												<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
												Subiendo...
											</>
										) : (
											'Subir Documento'
										)}
									</Button>
								</div>

								{activity.content?.questionsFilesSubida?.[0]?.parametros && (
									<p className="mt-4 text-sm text-gray-600">
										Parámetros:{' '}
										{activity.content.questionsFilesSubida[0].parametros}
									</p>
								)}
							</form>
						) : (
							<div className="text-center">
								<FileCheck2 className="mx-auto mb-4 size-16 text-green-500" />
								<p className="text-lg font-medium text-gray-900">
									Documento enviado correctamente
								</p>
								<p className="mt-2 text-sm text-gray-500">
									Tu documento está pendiente de revisión por el educador
								</p>
							</div>
						)}
					</div>

					{renderActionButtons()}
				</div>
			</DialogContent>
		</Dialog>
	);
}
