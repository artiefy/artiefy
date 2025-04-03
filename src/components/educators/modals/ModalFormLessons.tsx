'use client';
import { useState, type ChangeEvent, useEffect, useRef } from 'react';

import Image from 'next/image';

import { toast } from 'sonner';

import FileUpload from '~/components/educators/layout/FilesUpload';
import { Button } from '~/components/educators/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/educators/ui/dialog';
import { Progress } from '~/components/educators/ui/progress';

// Interfaz para los props del formulario de lecciones
interface LessonsFormProps {
	uploading: boolean;
	isOpen: boolean;
	onCloseAction: () => void;
	courseId: number;
	isEditing?: boolean;
	modalClassName?: string; // Use a single, consistent name
	onUpdateSuccess?: () => void;
	editingLesson?: {
		id?: number;
		title?: string;
		description?: string;
		duration?: number;
		coverImageKey?: string;
		coverVideoKey?: string;
		resourceKey?: string;
		resourceName?: string;
	};
}

interface LessonResponse {
	id: number;
	message: string;
}

const ModalFormLessons = ({
	uploading,
	isOpen,
	onCloseAction,
	courseId,
	isEditing = false,
	editingLesson,
	modalClassName, // Use the same name as in interface
	onUpdateSuccess,
}: LessonsFormProps) => {
	const [uploadProgress, setUploadProgress] = useState(0); // Estado para el progreso de subida
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		duration: 0,
		coverimage: undefined as File | undefined,
		covervideo: undefined as File | undefined,
		resourcefiles: [] as File[], // Array para múltiples archivos
		cover_image_key: '',
		cover_video_key: '',
		resource_keys: [] as string[],
	}); // Estado para los datos del formulario
	const [isUploading, setIsUploading] = useState(false); // Estado para la subida de archivos
	const [errors, setErrors] = useState({
		title: false,
		description: false,
		duration: false,
		cover_image_key: false,
		cover_video_key: false,
		resource_keys: false,
	}); // Estado para los errores del formulario
	const [uploadController, setUploadController] =
		useState<AbortController | null>(null); // Estado para el controlador de subida

	const videoRef = useRef<HTMLVideoElement | null>(null); // Referencia al video para capturar un frame
	const canvasRef = useRef<HTMLCanvasElement | null>(null); // Referencia al canvas para capturar un frame
	void setErrors;
	// Modificar el useEffect para inicializar con datos de edición
	useEffect(() => {
		if (isEditing && editingLesson) {
			setFormData({
				title: editingLesson.title ?? '',
				description: editingLesson.description ?? '',
				duration: editingLesson.duration ?? 0,
				coverimage: undefined,
				covervideo: undefined,
				resourcefiles: [],
				cover_image_key: editingLesson.coverImageKey ?? '',
				cover_video_key: editingLesson.coverVideoKey ?? '',
				resource_keys: editingLesson.resourceKey
					? editingLesson.resourceKey.split(',')
					: [],
			});
		}
	}, [isEditing, editingLesson]);

	// Manejador de cambio para inputs
	const handleInputChange = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
		field: keyof typeof formData
	) => {
		const value =
			field === 'duration' ? Number(e.target.value) : e.target.value;
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Función para obtener la duración de un video
	const getVideoDuration = (file: File): Promise<number> => {
		return new Promise((resolve, reject) => {
			const video = document.createElement('video');
			video.preload = 'metadata';

			video.onloadedmetadata = () => {
				window.URL.revokeObjectURL(video.src);
				resolve(video.duration / 60); // Convertir a minutos
			};

			video.onerror = () => {
				reject(new Error('Error al cargar el video'));
			};

			video.src = URL.createObjectURL(file);
		});
	};

	// Función para capturar un frame del video y convertirlo en imagen, pasandola a la portada
	const captureFrame = () => {
		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			const context = canvas.getContext('2d');
			if (context) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				context.drawImage(video, 0, 0, canvas.width, canvas.height);
				canvas.toBlob((blob) => {
					if (blob) {
						const file = new File([blob], 'coverimage.png', {
							type: 'image/png',
						});
						setFormData((prev) => ({
							...prev,
							coverimage: file,
							cover_image_key: 'coverimage.png', // Establecer la clave de la imagen de portada
						}));
					}
				}, 'image/png');
			}
		}
	};

	// Manejador de archivos
	const handleFileChange = async (
		field: keyof typeof formData,
		file: File | File[] | null
	) => {
		if (file) {
			if (Array.isArray(file)) {
				const resourceKeys = file.map((f) => f.name); // Simular claves para los archivos
				setFormData((prev) => ({
					...prev,
					resourcefiles: file,
					resource_keys: resourceKeys,
				}));
			} else {
				if (field === 'covervideo') {
					try {
						const duration = await getVideoDuration(file);
						setFormData((prev) => ({
							...prev,
							duration: Math.round(duration),
							[field]: file,
						}));
						if (videoRef.current) {
							videoRef.current.src = URL.createObjectURL(file);
						}
					} catch (error) {
						console.error('Error al obtener la duración del video:', error);
					}
				} else {
					setFormData((prev) => ({ ...prev, [field]: file }));
				}
			}
		}
	};

	// Subida de archivos a la API de S3
	const uploadFile = async (file: File, index: number, totalFiles: number) => {
		const controller = new AbortController();
		setUploadController(controller);
		const uploadResponse = await fetch('/api/upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contentType: file.type,
				fileSize: file.size,
				fileName: file.name,
			}),
		});

		if (!uploadResponse.ok) {
			throw new Error(
				`Error al iniciar la carga: ${uploadResponse.statusText}`
			);
		}

		const {
			url,
			fields,
			key,
			fileName,
		}: {
			url: string;
			fields: Record<string, string>;
			key: string;
			fileName: string;
		} = (await uploadResponse.json()) as {
			url: string;
			fields: Record<string, string>;
			key: string;
			fileName: string;
		};

		// Crear un FormData con los campos requeridos
		const formData = new FormData();
		Object.entries(fields).forEach(([key, value]) => {
			if (typeof value === 'string') {
				formData.append(key, value);
			}
		});
		formData.append('file', file);

		const uploadResult = await fetch(url, {
			method: 'POST',
			body: formData,
			signal: controller.signal,
		});
		if (!uploadResult.ok) {
			throw new Error(`Error al cargar el archivo: ${uploadResult.statusText}`);
		}
		const progress = Math.round(((index + 1) / totalFiles) * 100);
		setUploadProgress(progress); // Actualizamos el progreso
		return { key, fileName };
	};

	// Manejador del submit 'cabe recalcar que este un formulario autonomo que solo depende de la props del ID del curso'
	const handleSubmit = async () => {
		const controller = new AbortController();
		setUploadController(controller);
		setIsUploading(true);
		try {
			const { coverimage, covervideo, resourcefiles } = formData;
			const resourceKeys: string[] = [];
			const fileNames: string[] = [];

			let coverImageKey = formData.cover_image_key;
			const coverVideoKey = formData.cover_video_key;

			const totalFiles = [coverimage, ...resourcefiles].filter(Boolean).length;
			let currentIndex = 0;

			// Subir imagen primero si existe
			if (coverimage) {
				const { key } = await uploadFile(
					coverimage,
					currentIndex++,
					totalFiles
				);
				coverImageKey = key;
			}

			// Subir archivos de recursos
			for (const file of resourcefiles) {
				const { key, fileName } = await uploadFile(
					file,
					currentIndex++,
					totalFiles
				);
				resourceKeys.push(key);
				fileNames.push(fileName);
			}

			// Crear/actualizar la lección primero sin el video
			const method = isEditing ? 'PUT' : 'POST';
			const endpoint = '/api/educadores/lessons';

			const requestBody = {
				...(isEditing && { lessonId: editingLesson?.id }),
				title: formData.title,
				description: formData.description,
				duration: Number(formData.duration),
				coverImageKey: coverImageKey || undefined,
				coverVideoKey: coverVideoKey || undefined,
				resourceKey: resourceKeys.join(',') || undefined,
				resourceNames: fileNames.join(',') || undefined,
				courseId: Number(courseId),
			};

			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});

			const responseData = (await response.json()) as LessonResponse;
			const lessonId = isEditing ? editingLesson?.id : responseData.id;

			// Si hay un nuevo video para subir, hacerlo en segundo plano
			if (covervideo && lessonId) {
				toast.info('Subiendo video en segundo plano...', {
					duration: 0, // Mantener hasta que se complete
					id: 'video-upload',
				});

				uploadFile(covervideo, 0, 1)
					.then(async ({ key }) => {
						const updateResponse = await fetch('/api/educadores/lessons', {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								lessonId: lessonId,
								coverVideoKey: key,
							}),
						});

						if (updateResponse.ok) {
							toast.success('Video subido exitosamente', {
								duration: 3000,
							});
							toast.dismiss('video-upload');
							if (onUpdateSuccess) {
								onUpdateSuccess();
							}
						} else {
							throw new Error('Error al actualizar la lección con el video');
						}
					})
					.catch((error: unknown) => {
						const errorMessage =
							error instanceof Error ? error.message : String(error);
						toast.error(`Error al subir el video: ${errorMessage}`);
						toast.dismiss('video-upload');
					});
			}

			if (response.ok) {
				toast.success(isEditing ? 'Lección actualizada' : 'Lección creada');
				onCloseAction();
				if (onUpdateSuccess) {
					onUpdateSuccess();
				}
			}
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				console.log('Upload cancelled');
				return; // Salir de la función si se cancela la carga
			} else {
				toast('Error', {
					description: `Error al procesar la solicitud: ${String(error)}`,
				});
			}
		} finally {
			setIsUploading(false);
		}
	};

	// Manejador para cancelar la carga de archivos
	const handleCancel = () => {
		if (uploadController) {
			uploadController.abort();
		}
		onCloseAction();
	};

	// Renderizar el formulario
	return (
		<Dialog open={isOpen} onOpenChange={onCloseAction}>
			<DialogContent
				className={`max-h-[90vh] max-w-5xl overflow-y-auto ${modalClassName}`} // Use the same name
			>
				<DialogHeader className="mt-4">
					<DialogTitle className="text-4xl">
						{isEditing ? 'Actualizar' : 'Crear'} clase
					</DialogTitle>
					<DialogDescription className="text-xl text-white">
						Llena los detalles para crear la nuevo clase, la cual puede ser solo
						lectura.
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-lg bg-background px-6 shadow-md">
					<label htmlFor="title" className="text-lg font-medium text-primary">
						Título
					</label>
					<input
						type="text"
						placeholder="Título"
						value={formData.title}
						onChange={(e) => handleInputChange(e, 'title')}
						className={`mb-4 w-full rounded border p-2 text-white outline-none ${
							errors.title ? 'border-red-500' : 'border-primary'
						}`}
					/>
					{errors.title && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}

					<label
						htmlFor="description"
						className="text-lg font-medium text-primary"
					>
						Descripción
					</label>
					<textarea
						placeholder="Descripción"
						value={formData.description}
						onChange={(e) => handleInputChange(e, 'description')}
						className={`mb-3 h-auto w-full rounded border p-2 text-white outline-none ${
							errors.description ? 'border-red-500' : 'border-primary'
						}`}
					/>
					{errors.description && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					<label
						htmlFor="duration"
						className="text-lg font-medium text-primary"
					>
						Duración (minutos)
					</label>
					<input
						type="number"
						min="0"
						placeholder="Duración"
						value={formData.duration}
						onChange={(e) => handleInputChange(e, 'duration')}
						className={`mb-4 w-full rounded border p-2 text-white outline-none ${
							errors.duration ? 'border-red-500' : 'border-primary'
						}`}
					/>
					{errors.duration && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					{isEditing && (
						<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{formData.cover_image_key && (
								<div className="flex flex-col gap-2">
									<label className="text-sm font-medium text-primary">
										Imagen actual:
									</label>
									<Image
										src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${formData.cover_image_key}`}
										alt="Imagen actual"
										width={400}
										height={128}
										className="h-32 w-full rounded-lg object-cover"
									/>
								</div>
							)}
							{formData.cover_video_key && (
								<div className="flex flex-col gap-2">
									<label className="text-sm font-medium text-primary">
										Video actual:
									</label>
									<video
										src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${formData.cover_video_key}`}
										className="h-32 w-full rounded-lg object-cover"
										controls
									/>
								</div>
							)}
							{formData.resource_keys.length > 0 && (
								<div className="flex flex-col gap-2">
									<label className="text-sm font-medium text-primary">
										Archivos actuales:
									</label>
									{formData.resource_keys.map((key, index) => (
										<a
											key={index}
											href={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											{key.split('/').pop()}
										</a>
									))}
								</div>
							)}
						</div>
					)}
					<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<FileUpload
							key="coverimage"
							type="image"
							label="Imagen de portada:"
							accept="image/*"
							maxSize={5}
							tipo="Imagen"
							onFileChange={(file) =>
								handleFileChange('coverimage', file ?? null)
							}
							file={formData.coverimage} // Mostrar la imagen capturada
						/>
						<FileUpload
							key="covervideo"
							type="video"
							label="Video de la clase:"
							accept="video/mp4"
							maxSize={16000} // Aumentado a 16GB (16000MB)
							tipo="Video"
							onFileChange={(file) =>
								handleFileChange('covervideo', file ?? null)
							}
						/>
						<FileUpload
							key="resourcefiles"
							type="file"
							label="Archivo de la clase:"
							accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx"
							maxSize={10}
							multiple
							tipo="Archivos"
							onFileChange={(file) =>
								handleFileChange('resourcefiles', file ?? null)
							}
						/>
					</div>
					{formData.covervideo && (
						<div className="mt-4 space-y-5">
							<video
								ref={videoRef}
								controls
								className="mx-auto rounded-lg md:w-1/2 lg:w-1/2"
							>
								<source
									src={URL.createObjectURL(formData.covervideo)}
									type="video/mp4"
								/>
							</video>
							<div className="mx-auto mt-2 w-fit">
								<Button onClick={captureFrame}>
									Capturar frame como imagen de portada
								</Button>
								<canvas ref={canvasRef} className="hidden" />
							</div>
						</div>
					)}
					{(uploading || isUploading) && (
						<div className="mt-4">
							<Progress value={uploadProgress} className="w-full" />
							<p className="mt-2 text-center text-sm text-gray-500">
								{uploadProgress}% Completado
							</p>
						</div>
					)}
				</div>
				<DialogFooter className="mt-4 grid grid-cols-2 gap-4">
					<Button
						onClick={handleCancel}
						className="mr-2 w-full border-transparent bg-gray-600 p-3 text-white hover:bg-gray-700"
					>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} variant="default" disabled={uploading}>
						{isEditing ? 'Actualizar' : isUploading ? 'Subiendo' : 'Crear'}{' '}
						Clase
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ModalFormLessons;
