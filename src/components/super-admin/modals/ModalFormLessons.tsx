'use client';
import { type ChangeEvent, useEffect, useRef,useState } from 'react';

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
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';
import { Switch } from '~/components/educators/ui/switch';

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

interface UploadResponse {
	uploadType: 'simple' | 'multipart' | 'put';
	url: string;
	fields?: Record<string, string>;
	key: string;
	fileName: string;
	uploadId?: string;
	contentType: string;
}

interface UploadProgress {
	fileName: string;
	progress: number;
	status: 'uploading' | 'completed' | 'error';
	estimatedTimeRemaining?: string;
	startTime?: number;
}

interface UploadResult {
	key: string;
	fileName: string;
}

const ModalFormLessons = ({
	uploading,
	isOpen,
	onCloseAction,
	courseId,
	isEditing = false,
	editingLesson,
	modalClassName,
	onUpdateSuccess,
}: LessonsFormProps) => {
	const [needsVideo, setNeedsVideo] = useState(false);
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
	const [uploadProgresses, setUploadProgresses] = useState<
		Record<string, UploadProgress>
	>({});

	const videoRef = useRef<HTMLVideoElement | null>(null); // Referencia al video para capturar un frame
	const canvasRef = useRef<HTMLCanvasElement | null>(null); // Referencia al canvas para capturar un frame
	void setErrors;

	// Modificar el useEffect para inicializar con datos de edición
	useEffect(() => {
		if (isEditing && editingLesson) {
			const hasVideo =
				!!editingLesson.coverVideoKey && editingLesson.coverVideoKey !== 'none';
			setNeedsVideo(hasVideo);
			console.log('editingLesson.coverVideoKey:', editingLesson.coverVideoKey);
			console.log('hasVideo?', hasVideo);

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

	// Función auxiliar para actualizar el progreso
	const updateProgress = (
		fileName: string,
		progress: number,
		status: UploadProgress['status'] = 'uploading',
		estimatedTimeRemaining?: string
	) => {
		setUploadProgresses((prev) => ({
			...prev,
			[fileName]: { fileName, progress, status, estimatedTimeRemaining },
		}));
	};

	// Función para calcular tiempo estimado
	const calculateEstimatedTime = (fileSize: number): string => {
		// Velocidad promedio asumida (1 MB/s)
		const avgSpeed = 1 * 1024 * 1024; // 1 MB/s en bytes
		const totalSeconds = fileSize / avgSpeed;

		if (totalSeconds < 60) {
			return 'menos de 1 minuto';
		} else if (totalSeconds < 3600) {
			return `aproximadamente ${Math.round(totalSeconds / 60)} minutos`;
		} else {
			return `aproximadamente ${Math.round(totalSeconds / 3600)} horas`;
		}
	};

	// Subida de archivos a la API de S3
	const uploadFile = async (file: File): Promise<UploadResult> => {
		const controller = new AbortController();
		setUploadController(controller);

		// Mostrar tiempo estimado inicial
		const estimatedTime = calculateEstimatedTime(file.size);
		toast.info(`Iniciando carga de ${file.name}`, {
			description: `Tiempo estimado: ${estimatedTime}`,
			duration: 5000,
		});

		try {
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

			const uploadData = (await uploadResponse.json()) as UploadResponse;

			return new Promise<UploadResult>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				const startTime = Date.now();

				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						const percentComplete = (event.loaded / event.total) * 100;
						const elapsedTime = (Date.now() - startTime) / 1000; // segundos
						const uploadSpeed = event.loaded / elapsedTime; // bytes por segundo
						const remainingBytes = event.total - event.loaded;
						const remainingTime = remainingBytes / uploadSpeed;

						let timeRemaining = '';
						if (remainingTime < 60) {
							timeRemaining = `${Math.round(remainingTime)} segundos`;
						} else if (remainingTime < 3600) {
							timeRemaining = `${Math.round(remainingTime / 60)} minutos`;
						} else {
							timeRemaining = `${Math.round(remainingTime / 3600)} horas`;
						}

						updateProgress(
							file.name,
							Math.round(percentComplete),
							'uploading',
							timeRemaining
						);
					}
				};

				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						updateProgress(file.name, 100, 'completed');
						toast.success(`${file.name} subido exitosamente`);
						resolve({
							key: uploadData.key,
							fileName: uploadData.fileName,
						});
					} else {
						updateProgress(file.name, 0, 'error');
						reject(new Error(`Error en la carga: ${xhr.status}`));
					}
				};

				xhr.onerror = () => {
					updateProgress(file.name, 0, 'error');
					reject(new Error('Upload failed'));
				};

				if (uploadData.uploadType === 'put') {
					xhr.open('PUT', uploadData.url);
					xhr.setRequestHeader('Content-Type', file.type);
					xhr.send(file);
				} else if (uploadData.uploadType === 'simple') {
					const formData = new FormData();
					Object.entries(uploadData.fields ?? {}).forEach(([key, value]) => {
						formData.append(key, value);
					});
					formData.append('file', file);
					xhr.open('POST', uploadData.url);
					xhr.send(formData);
				}
			});
		} catch (error) {
			console.error('Error en uploadFile:', error);
			updateProgress(file.name, 0, 'error');
			throw new Error(error instanceof Error ? error.message : 'Unknown error');
		}
	};

	// Manejador del submit 'cabe recalcar que este un formulario autonomo que solo depende de la props del ID del curso'
	const handleSubmit = async () => {
		console.log('Iniciando handleSubmit');
		const controller = new AbortController();
		setUploadController(controller);
		setIsUploading(true);
		try {
			const { coverimage, covervideo, resourcefiles } = formData;
			console.log('Estado actual del formulario:', {
				needsVideo,
				coverimage: coverimage?.name,
				covervideo: covervideo?.name,
				resourcefiles: resourcefiles.map((f) => f.name),
				formData,
			});

			const resourceKeys: string[] = [];
			const fileNames: string[] = [];

			let coverImageKey = formData.cover_image_key;
			let coverVideoKey = formData.cover_video_key;

			// Manejar el video según needsVideo
			if (!needsVideo) {
				console.log(
					'No se necesita video, estableciendo coverVideoKey como "none"'
				);
				coverVideoKey = 'none';
			} else if (covervideo) {
				console.log('Subiendo video...');
				const videoResult = await uploadFile(covervideo);
				coverVideoKey = videoResult.key;
				console.log('Video subido exitosamente:', coverVideoKey);
			}

			if (coverimage) {
				console.log('Subiendo imagen...');
				const result = await uploadFile(coverimage);
				coverImageKey = result.key;
				console.log('Imagen subida exitosamente:', coverImageKey);
			}

			if (resourcefiles.length > 0) {
				console.log('Subiendo archivos de recursos...');
				const results = await Promise.all(resourcefiles.map(uploadFile));
				results.forEach(({ key, fileName }) => {
					resourceKeys.push(key);
					fileNames.push(fileName);
				});
				console.log('Recursos subidos:', { resourceKeys, fileNames });
			}

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

			console.log('Enviando petición al servidor:', {
				method,
				endpoint,
				requestBody,
			});

			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});

			console.log('Respuesta del servidor:', {
				status: response.status,
				ok: response.ok,
			});

			const responseData = (await response.json()) as { message?: string };

			console.log('Datos de respuesta:', responseData);

			if (response.ok) {
				toast.success(isEditing ? 'Lección actualizada' : 'Lección creada');
				onCloseAction();
				if (onUpdateSuccess) {
					onUpdateSuccess();
				}
			} else {
				throw new Error(responseData.message ?? 'Error al guardar la lección');
			}
		} catch (error) {
			console.error('Error en handleSubmit:', error);
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('Upload cancelled');
				return;
			}
			toast.error('Error', {
				description:
					error instanceof Error ? error.message : 'Error desconocido',
			});
		} finally {
			setIsUploading(false);
			console.log('HandleSubmit finalizado');
		}
	};

	// Manejador para cancelar la carga de archivos
	const handleCancel = () => {
		if (uploadController) {
			uploadController.abort();
		}
		onCloseAction();
	};

	// Añadir componente de progreso persistente
	const UploadProgressDisplay = () => (
		<div className="bg-background fixed right-4 bottom-4 z-50 w-96 rounded-lg p-4 shadow-lg">
			<h3 className="text-primary mb-2 font-semibold">Progreso de carga</h3>
			{Object.values(uploadProgresses).map((item) => (
				<div key={item.fileName} className="mb-4">
					<div className="flex justify-between text-sm">
						<span className="truncate">{item.fileName}</span>
						<span>{item.progress}%</span>
					</div>
					<Progress value={item.progress} className="mb-1 h-2" />
					{item.status === 'uploading' && item.estimatedTimeRemaining && (
						<p className="text-xs text-gray-400">
							Tiempo restante: {item.estimatedTimeRemaining}
						</p>
					)}
				</div>
			))}
		</div>
	);

	// Renderizar el formulario
	return (
		<>
			<Dialog open={isOpen} onOpenChange={onCloseAction}>
				<DialogContent
					className={`max-h-[90vh] max-w-5xl overflow-y-auto ${modalClassName}`}
				>
					<DialogHeader className="mt-4">
						<DialogTitle className="text-4xl">
							{isEditing ? 'Actualizar' : 'Crear'} clase
						</DialogTitle>
						<DialogDescription className="text-xl text-white">
							Llena los detalles para crear la nuevo clase, la cual puede ser
							solo lectura.
						</DialogDescription>
					</DialogHeader>
					<div className="bg-background rounded-lg px-6 shadow-md">
						<label htmlFor="title" className="text-primary text-lg font-medium">
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
							className="text-primary text-lg font-medium"
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
							className="text-primary text-lg font-medium"
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
						<div className="mb-4 flex items-center space-x-2">
							<Switch
								id="needs-video"
								checked={needsVideo}
								onChange={(e) => setNeedsVideo(e.target.checked)}
							/>
							<Label
								htmlFor="needs-video"
								className="text-primary text-lg font-medium"
							>
								¿Esta clase necesita video?
							</Label>
						</div>
						{isEditing && (
							<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{formData.cover_image_key && (
									<div className="flex flex-col gap-2">
										<label className="text-primary text-sm font-medium">
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
										<label className="text-primary text-sm font-medium">
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
										<label className="text-primary text-sm font-medium">
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
								file={formData.coverimage}
							/>
							{needsVideo && (
								<FileUpload
									key="covervideo"
									type="video"
									label="Video de la clase:"
									accept="video/mp4"
									maxSize={16000}
									tipo="Video"
									onFileChange={(file) =>
										handleFileChange('covervideo', file ?? null)
									}
								/>
							)}
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
								<Progress
									value={
										Object.values(uploadProgresses).reduce(
											(acc, curr) => acc + curr.progress,
											0
										) / Math.max(1, Object.values(uploadProgresses).length)
									}
									className="w-full"
								/>
								<p className="mt-2 text-center text-sm text-gray-500">
									{Object.values(uploadProgresses).length > 0
										? 'Subiendo archivos...'
										: 'Completado'}
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
						<Button
							onClick={handleSubmit}
							variant="default"
							disabled={uploading}
						>
							{isEditing ? 'Actualizar' : isUploading ? 'Subiendo' : 'Crear'}{' '}
							Clase
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{Object.keys(uploadProgresses).length > 0 && <UploadProgressDisplay />}
		</>
	);
};

export default ModalFormLessons;
