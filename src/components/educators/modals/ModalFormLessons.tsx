'use client';

import { useState, type ChangeEvent, useEffect, useRef } from 'react';

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

interface LessonsFormProps {
	uploading: boolean;
	isOpen: boolean;
	onCloseAction: () => void;
	courseId: number; // ID del curso relacionado
	isEditing?: boolean;
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

const ModalFormLessons = ({
	uploading,
	isOpen,
	onCloseAction,
	courseId,
	isEditing = false,
	editingLesson,
}: LessonsFormProps) => {
	const [uploadProgress, setUploadProgress] = useState(0);
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
	});
	const [isUploading, setIsUploading] = useState(false);
	const [errors, setErrors] = useState({
		title: false,
		description: false,
		duration: false,
		cover_image_key: false,
		cover_video_key: false,
		resource_keys: false,
	});
	const [uploadController, setUploadController] =
		useState<AbortController | null>(null);

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

	// Subida de archivos
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

	// Manejador del submit
	const handleSubmit = async () => {
		const controller = new AbortController();
		setUploadController(controller);
		setIsUploading(true);
		try {
			const { coverimage, covervideo, resourcefiles } = formData;
			const resourceKeys: string[] = [];
			const fileNames: string[] = [];

			let coverImageKey = formData.cover_image_key;
			let coverVideoKey = '';
			let coverImageName = '';
			let coverVideoName = '';

			const totalFiles = [coverimage, covervideo, ...resourcefiles].filter(
				Boolean
			).length;

			let currentIndex = 0;
			// Subir imagen de portada
			if (coverimage) {
				const { key, fileName } = await uploadFile(
					coverimage,
					currentIndex++,
					totalFiles
				);
				coverImageKey = key;
				coverImageName = fileName;
			}
			// Subir video de portada
			if (covervideo) {
				const { key, fileName } = await uploadFile(
					covervideo,
					currentIndex++,
					totalFiles
				);
				coverVideoKey = key;
				coverVideoName = fileName;
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

			// Actualizar el estado con las claves de las imágenes y el video
			setFormData((prev) => ({
				...prev,
				cover_image_key: coverImageKey,
				cover_video_key: coverVideoKey,
				cover_image_name: coverImageName,
				cover_video_name: coverVideoName,
			}));

			// Validar campos después de establecer las claves de los archivos
			const newErrors = {
				title: !formData.title,
				description: !formData.description,
				duration: !formData.duration,
			};

			if (Object.values(newErrors).some((error) => error)) {
				setErrors((prevErrors) => ({ ...prevErrors, ...newErrors }));
				toast('Error', {
					description: 'Por favor completa los campos obligatorios.',
				});
				return;
			}

			if (controller.signal.aborted) {
				console.log('Upload cancelled');
				return; // Salir de la función si se cancela la carga
			}

			const concatenatedResourceKeys = resourceKeys.join(',');
			const concatenatedFileNames = fileNames.join(',');

			const endpoint = isEditing
				? `/api/educadores/lessons/${editingLesson?.id}`
				: '/api/educadores/lessons';

			const method = isEditing ? 'PUT' : 'POST';

			const response = await fetch(endpoint, {
				method: method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: formData.title,
					description: formData.description,
					duration: Number(formData.duration),
					coverImageKey: coverImageKey || formData.cover_image_key || undefined,
					coverVideoKey: coverVideoKey || formData.cover_video_key || undefined,
					resourceKey: concatenatedResourceKeys || undefined,
					resourceNames: concatenatedFileNames || undefined,
					courseId: Number(courseId),
				}),
			});

			if (response.ok) {
				toast(isEditing ? 'Lección actualizada' : 'Lección creada', {
					description: isEditing
						? 'La lección se actualizó con éxito.'
						: 'La lección se creó con éxito.',
				});
				onCloseAction();
				window.location.reload();
			} else {
				const errorData = (await response.json()) as { error?: string };
				toast('Error', {
					description: errorData.error ?? 'Error al crear la lección.',
				});
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

	const handleCancel = () => {
		if (uploadController) {
			uploadController.abort();
		}
		onCloseAction();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onCloseAction}>
			<DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
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
							maxSize={2000}
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
								<canvas ref={canvasRef} className="hidden"></canvas>
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
