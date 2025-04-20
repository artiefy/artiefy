/* eslint-disable react-hooks/exhaustive-deps */
/* editar curso en super admin*/
'use client';

import { useEffect, useState, type ChangeEvent } from 'react';

import Image from 'next/image';

import { Plus } from 'lucide-react';
import { FiUploadCloud } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import Select, { type MultiValue } from 'react-select';
import { toast } from 'sonner';

import ActiveDropdown from '~/components/educators/layout/ActiveDropdown';
import CourseTypeDropdown from '~/components/educators/layout/TypesCourseDropdown';
import { Button } from '~/components/educators/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';
import { Progress } from '~/components/educators/ui/progress';

// Interfaz para los parámetros del formulario del course
interface CourseFormProps {
	onSubmitAction: (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		nivelid: number,
		rating: number,
		addParametros: boolean,
		coverImageKey: string,
		fileName: string,
		courseTypeId: number | null,
		isActive: boolean,
		subjects: { id: number }[]
	) => Promise<void>;
	uploading: boolean;
	editingCourseId: number | null;
	title: string;
	setTitle: (title: string) => void;
	description: string;
	setDescription: (description: string) => void;
	categoryid: number;
	setCategoryid: (categoryid: number) => void;
	modalidadesid: number;
	setModalidadesid: (modalidadesid: number) => void;
	nivelid: number;
	setNivelid: (nivelid: number) => void;
	coverImageKey: string;
	setCoverImageKey: (coverImageKey: string) => void;
	parametros: {
		id: number;
		name: string;
		description: string;
		porcentaje: number;
	}[];
	setParametrosAction: (
		parametros: {
			id: number;
			name: string;
			description: string;
			porcentaje: number;
		}[]
	) => void;
	isOpen: boolean;
	onCloseAction: () => void;
	rating: number;
	setRating: (rating: number) => void;
	courseTypeId: number | null;
	setCourseTypeId: (val: number | null) => void;
	isActive: boolean;
	setIsActive: (val: boolean) => void;
	instructor: string;
	setInstructor: (instructor: string) => void;
	educators?: { id: string; name: string }[];
	subjects: { id: number }[];
	setSubjects: (subjects: { id: number }[]) => void;
	defaultAddParametros?: boolean; // Agregar esta prop
}

// Interfaz para los niveles
interface Nivel {
	id: number;
	name: string;
	description: string;
}

// Add these interfaces after the existing interfaces
interface Category {
	id: number;
	name: string;
	description: string;
}

interface Modalidad {
	id: number;
	name: string;
	description: string;
}

// Componente ModalFormCourse
const ModalFormCourse: React.FC<CourseFormProps> = ({
	onSubmitAction,
	uploading,
	editingCourseId,
	title,
	setTitle,
	description,
	setDescription,
	rating,
	setRating,
	categoryid,
	setCategoryid,
	modalidadesid,
	setModalidadesid,
	nivelid,
	setNivelid,
	coverImageKey,
	parametros = [],
	setParametrosAction,
	isOpen,
	onCloseAction,
	courseTypeId,
	setCourseTypeId,
	isActive, // <-- agrega esto
	setIsActive,
	setInstructor,
	educators = [],
	instructor,
	subjects,
	setSubjects,
	defaultAddParametros = false, // Agregar este prop con valor por defecto
}) => {
	const [file, setFile] = useState<File | null>(null); // Estado para el archivo
	const [fileName, setFileName] = useState<string | null>(null); // Estado para el nombre del archivo
	const [fileSize, setFileSize] = useState<number | null>(null); // Estado para el tamaño del archivo
	const [progress, setProgress] = useState(0); // Estado para el progreso
	const [isEditing, setIsEditing] = useState(false); // Estado para la edición
	const [isDragging, setIsDragging] = useState(false); // Estado para el arrastre
	void setIsDragging;
	const [allSubjects, setAllSubjects] = useState<
		{ id: number; title: string }[]
	>([]);
	const [niveles, setNiveles] = useState<Nivel[]>([]);
	const [isLoadingNiveles, setIsLoadingNiveles] = useState(true);
	void isLoadingNiveles;
	const [errors, setErrors] = useState({
		title: false,
		description: false,
		categoryid: false,
		category: false,
		modalidadesid: false,
		rating: false, // Añadir esta línea
		nivelid: false,
		file: false,
		nivel: false,
		modalidad: false,
	}); // Estado para los errores
	const [uploadProgress, setUploadProgress] = useState(0); // Estado para el progreso de subida
	const [isUploading, setIsUploading] = useState(false); // Estado para la subida
	const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set()); // Estado para los campos modificados
	const [currentCoverImageKey] = useState(coverImageKey); // Estado para la imagen de portada
	const [uploadController, setUploadController] =
		useState<AbortController | null>(null); // Estado para el controlador de subida
	const [coverImage, setCoverImage] = useState<string | null>(null); // Estado para la imagen de portada
	const [addParametros, setAddParametros] = useState(defaultAddParametros);

	// Add these new states with other useState declarations
	const [categories, setCategories] = useState<Category[]>([]);
	const [modalidades, setModalidades] = useState<Modalidad[]>([]);
	const [isLoadingCategories, setIsLoadingCategories] = useState(true);
	const [isLoadingModalidades, setIsLoadingModalidades] = useState(true);
	void isLoadingCategories;
	void isLoadingModalidades;

	// Función para manejar el cambio de archivo
	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files?.[0]) {
			setFile(files[0]);
			setFileName(files[0].name);
			setFileSize(files[0].size);
			setErrors((prev) => ({ ...prev, file: false }));
		} else {
			setFile(null);
			setFileName(null);
			setFileSize(null);
			setErrors((prev) => ({ ...prev, file: true }));
		}
		console.log('coverImageKey', coverImage); // Registro de depuración
	};

	// Función para manejar la adición o creacion de parámetros
	const handleAddParametro = () => {
		if (parametros.length < 10) {
			setParametrosAction([
				...parametros,
				{
					id: parametros.length + 1,
					name: '',
					description: '',
					porcentaje: 0,
				},
			]);
		}
	};

	useEffect(() => {
		const fetchSubjects = async () => {
			try {
				const response = await fetch(
					editingCourseId
						? `/api/super-admin/programs/materiasCourses?courseId=${editingCourseId}`
						: '/api/super-admin/programs/materiasCourses'
				);

				if (response.ok) {
					const subjectsData = (await response.json()) as {
						id: number;
						title: string;
					}[];
					setAllSubjects(subjectsData);
				} else {
					throw new Error('Error al obtener materias');
				}
			} catch (error) {
				console.error('Error al obtener materias:', error);
			}
		};

		if (isOpen) {
			void fetchSubjects();
		}
	}, [isOpen, editingCourseId]);

	useEffect(() => {
		const fetchNiveles = async () => {
			setIsLoadingNiveles(true);
			try {
				const response = await fetch('/api/educadores/nivel', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					const errorData = await response.text();
					throw new Error(`Error al obtener los niveles: ${errorData}`);
				}

				const data = (await response.json()) as Nivel[];
				setNiveles(data);
			} catch (error) {
				console.error('Error detallado:', error);
			} finally {
				setIsLoadingNiveles(false);
			}
		};

		void fetchNiveles();
	}, []);

	// Add these useEffects after other useEffects
	useEffect(() => {
		const fetchCategories = async () => {
			setIsLoadingCategories(true);
			try {
				const response = await fetch('/api/educadores/categories', {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				});

				if (!response.ok) {
					throw new Error(
						`Error al obtener las categorías: ${await response.text()}`
					);
				}

				const data = (await response.json()) as Category[];
				setCategories(data);
			} catch (error) {
				console.error('Error detallado:', error);
			} finally {
				setIsLoadingCategories(false);
			}
		};

		void fetchCategories();
	}, []);

	useEffect(() => {
		const fetchModalidades = async () => {
			setIsLoadingModalidades(true);
			try {
				const response = await fetch('/api/educadores/modalidades', {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				});

				if (!response.ok) {
					throw new Error(
						`Error al obtener las modalidades: ${await response.text()}`
					);
				}

				const data = (await response.json()) as Modalidad[];
				setModalidades(data);
			} catch (error) {
				console.error('Error detallado:', error);
			} finally {
				setIsLoadingModalidades(false);
			}
		};

		void fetchModalidades();
	}, []);

	// Función para manejar el cambio de parámetros
	const handleParametroChange = (
		index: number,
		field: 'name' | 'description' | 'porcentaje',
		value: string | number
	) => {
		const updatedParametros = [...parametros];
		updatedParametros[index] = {
			...updatedParametros[index],
			[field]: value,
		};

		// Validar que la suma de los porcentajes no supere el 100%
		const sumaPorcentajes = updatedParametros.reduce(
			(acc, parametro) => acc + parametro.porcentaje,
			0
		);
		if (sumaPorcentajes > 100) {
			toast('Error', {
				description: 'La suma de los porcentajes no puede superar el 100%',
			});
			return;
		}

		setParametrosAction(
			updatedParametros.map((parametro, index) => ({
				...parametro,
				id: index + 1,
			}))
		);
	};

	// Función para manejar la eliminación de parámetros
	const handleRemoveParametro = (index: number) => {
		const updatedParametros = parametros.filter((_, i) => i !== index);
		// Reasignar los valores de entrega
		const reassignedParametros = updatedParametros.map((parametro) => ({
			id: parametro.id,
			name: parametro.name,
			description: parametro.description,
			porcentaje: parametro.porcentaje,
		}));
		setParametrosAction(reassignedParametros);
	};

	// Función para obtener los archivos de subida y enviarselo al componente padre donde se hace el metodo POST
	const handleSubmit = async () => {
		const controller = new AbortController();
		setUploadController(controller);
		// Validar los campos del formulario
		const newErrors = {
			title: !editingCourseId && !title,
			description: !editingCourseId && !description,
			categoryid: !editingCourseId && !categoryid,
			category: false,
			modalidadesid: !editingCourseId && !modalidadesid,
			nivelid: !editingCourseId && !nivelid,
			nivel: false,
			rating: !editingCourseId && !rating, // Añadir esta línea
			file: !editingCourseId && !file && !currentCoverImageKey,
			modalidad: false,
		};

		if (editingCourseId) {
			newErrors.title = modifiedFields.has('title') && !title;
			newErrors.description = modifiedFields.has('description') && !description;
			newErrors.nivelid = modifiedFields.has('nivelid')
				? !nivelid
				: !!newErrors.nivelid;
			newErrors.file = modifiedFields.has('file') && !file;
			newErrors.modalidadesid =
				modifiedFields.has('modalidadesid') && !modalidadesid;
			newErrors.rating = modifiedFields.has('rating') && !rating; // Añadir esta línea
		}

		// Validar que la suma de los porcentajes sea igual a 100
		const sumaPorcentajes = parametros.reduce(
			(acc, parametro) => acc + parametro.porcentaje,
			0
		);
		if (addParametros && sumaPorcentajes !== 100) {
			toast('Error', {
				description: 'La suma de los porcentajes debe ser igual a 100%',
			});
			return;
		}

		setErrors(newErrors);

		if (Object.values(newErrors).some((error) => error)) {
			console.log('Validation errors:', newErrors); // Registro de depuración
			return;
		}

		setIsEditing(true);
		setIsUploading(true);
		try {
			let coverImageKey = currentCoverImageKey ?? '';
			let uploadedFileName = fileName ?? '';

			// Subir la imagen de portada a S3
			if (file) {
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contentType: file.type,
						fileSize: file.size,
						fileName: file.name, // Asegúrate de pasar el fileName correcto
					}),
				});

				if (!uploadResponse.ok) {
					throw new Error(
						`Error: al iniciar la carga: ${uploadResponse.statusText}`
					);
				}

				const uploadData = (await uploadResponse.json()) as {
					url: string;
					fields: Record<string, string>;
					key: string;
					fileName: string;
				};

				const { url, fields, key, fileName: responseFileName } = uploadData;
				coverImageKey = key;
				uploadedFileName = responseFileName;

				const formData = new FormData();
				Object.entries(fields).forEach(([key, value]) => {
					if (typeof value === 'string') {
						formData.append(key, value);
					}
				});
				formData.append('file', file);

				await fetch(url, {
					method: 'POST',
					body: formData,
				});
			}

			// Enviar los datos a post
			await onSubmitAction(
				editingCourseId ? editingCourseId.toString() : '',
				title,
				description,
				file,
				categoryid,
				modalidadesid,
				nivelid,
				rating,
				addParametros,
				coverImageKey,
				uploadedFileName,
				courseTypeId,
				isActive,
				subjects
			);
			if (controller.signal.aborted) {
				console.log('Upload cancelled');
				return;
			}

			setIsUploading(false);
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				console.log('Upload cancelled');
				return; // Salir de la función si se cancela la carga
			} else {
				console.error('Error al enviar:', error);
			}
			setIsUploading(false);
		}
	};

	// Función para cancelar la carga
	const handleCancel = () => {
		if (uploadController) {
			uploadController.abort();
		}
		onCloseAction();
	};

	// Función para manejar el cambio de campo
	const handleFieldChange = (
		field: string,
		value: string | number | File | null
	) => {
		setModifiedFields((prev) => new Set(prev).add(field));
		switch (field) {
			case 'title':
				setTitle(value as string);
				break;
			case 'description':
				setDescription(value as string);
				break;
			case 'categoryid':
				setCategoryid(value as number);
				break;
			case 'modalidadesid':
				setModalidadesid(value as number);
				break;
			case 'rating':
				setRating(value as number);
				break;
			case 'nivelid':
				setNivelid(value as number);
				break;
			case 'file':
				setFile(value as File);
				break;
		}
	};
	useEffect(() => {
		if (editingCourseId) {
			setCourseTypeId(courseTypeId);
		}
	}, [editingCourseId]);

	// Add this useEffect to handle instructor initialization when editing
	useEffect(() => {
		if (editingCourseId && instructor) {
			setInstructor(instructor);
			// Actualizar el estado local cuando cambie el instructor
			const selectedEducator = educators?.find((e) => e.id === instructor);
			if (selectedEducator) {
				setModifiedFields((prev) => new Set(prev).add('instructor'));
			}
		}
	}, [editingCourseId, instructor, educators]);

	// Efecto para manejar el progreso de carga
	useEffect(() => {
		if (uploading) {
			setProgress(0);
			const interval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 100) {
						clearInterval(interval);
						return 100;
					}
					return prev + 1;
				});
			}, 50);
			return () => clearInterval(interval);
		}
	}, [uploading]);

	// Efecto para manejar el progreso de carga al 100%
	useEffect(() => {
		if (progress === 100) {
			const timeout = setTimeout(() => {
				setProgress(0);
			}, 500);

			return () => clearTimeout(timeout);
		}
	}, [progress]);

	// Efecto para manejar la carga de archivos
	useEffect(() => {
		if (!uploading && isEditing) {
			setIsEditing(false);
		}
	}, [uploading, isEditing]);

	// Efecto para manejar la carga de archivos
	useEffect(() => {
		if (isUploading) {
			setUploadProgress(0);
			const interval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev >= 100) {
						clearInterval(interval);
						return 100;
					}
					return prev + 10; // Incrementar de 10 en 10
				});
			}, 500);

			return () => clearInterval(interval);
		}
	}, [isUploading]);

	// Efecto para manejar la carga de los inputs
	useEffect(() => {
		if (editingCourseId) {
			setTitle(title);
			setDescription(description);
			setCategoryid(categoryid);
			setRating(rating); // Añadir esta línea
			setModalidadesid(modalidadesid);
			setNivelid(Number(nivelid)); // Asegúrate de convertir a número
			setCoverImage(coverImageKey);
			setCourseTypeId(courseTypeId ?? null);
			setIsActive(isActive);
		}
	}, [editingCourseId]);

	// Efecto para manejar la creacion o edicion de parametros
	const handleToggleParametro = () => {
		setAddParametros((prevAddParametro) => !prevAddParametro);
	};

	// Efecto para manejar la creacion o edicion del curso
	useEffect(() => {
		if (isOpen && !editingCourseId) {
			setTitle('');
			setDescription('');
			setCategoryid(0);
			setModalidadesid(0);
			setNivelid(0);
			setCoverImage('');
			setRating(NaN);
			setParametrosAction([]);
		}
	}, [isOpen, editingCourseId]);

	// Agregar este useEffect para manejar la imagen existente cuando se edita
	useEffect(() => {
		if (editingCourseId && coverImageKey) {
			setCoverImage(coverImageKey);
		} else {
			setCoverImage(null);
		}
	}, [editingCourseId, coverImageKey]);

	// Modificar useEffect para manejar los parámetros
	useEffect(() => {
		if (editingCourseId) {
			setAddParametros(parametros.length > 0);
		}
	}, [editingCourseId, parametros]);

	// Render la vista
	return (
		<Dialog open={isOpen} onOpenChange={onCloseAction}>
			<DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto p-3 md:p-6">
				<DialogHeader className="mt-2 md:mt-4">
					<DialogTitle className="text-xl md:text-4xl">
						{editingCourseId ? 'Editar Curso' : 'Crear Curso'}
					</DialogTitle>
					<DialogDescription className="text-sm text-white md:text-xl">
						{editingCourseId
							? 'Edita los detalles del curso'
							: 'Llena los detalles para crear un nuevo curso'}
					</DialogDescription>
				</DialogHeader>
				<div className="bg-background rounded-lg px-2 py-3 text-black shadow-md md:px-6 md:py-4">
					<div className="space-y-3 md:space-y-4">
						<div>
							<label
								htmlFor="title"
								className="text-primary text-sm font-medium md:text-lg"
							>
								Título
							</label>
							<input
								type="text"
								placeholder="Título"
								value={title}
								onChange={(e) => handleFieldChange('title', e.target.value)}
								className={`mt-1 w-full rounded border p-2 text-sm text-white outline-none md:text-base ${errors.title ? 'border-red-500' : 'border-primary'}`}
							/>
							{errors.title && (
								<p className="text-xs text-red-500 md:text-sm">
									Este campo es obligatorio.
								</p>
							)}
						</div>
						<div>
							<label
								htmlFor="description"
								className="text-primary text-sm font-medium md:text-lg"
							>
								Descripción
							</label>
							<textarea
								placeholder="Descripción"
								value={description}
								onChange={(e) =>
									handleFieldChange('description', e.target.value)
								}
								className={`mt-1 w-full rounded border p-2 text-sm text-white outline-none md:text-base ${errors.description ? 'border-red-500' : 'border-primary'}`}
								rows={4}
							/>
							{errors.description && (
								<p className="text-xs text-red-500 md:text-sm">
									Este campo es obligatorio.
								</p>
							)}
						</div>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							<div className="w-full">
								<label className="text-primary text-sm font-medium md:text-lg">
									Nivel
								</label>
								<select
									className="bg-background mt-1 w-full rounded border p-2 text-sm text-white md:text-base"
									value={nivelid}
									onChange={(e) => setNivelid(Number(e.target.value))}
								>
									{niveles.map((nivel) => (
										<option key={nivel.id} value={nivel.id}>
											{nivel.name}
										</option>
									))}
								</select>
								{errors.nivelid && (
									<p className="text-sm text-red-500">
										Este campo es obligatorio.
									</p>
								)}
							</div>
							<div className="w-full">
								<label className="text-primary text-sm font-medium md:text-lg">
									Modalidad
								</label>
								<select
									className="bg-background mt-1 w-full rounded border p-2 text-sm text-white md:text-base"
									value={modalidadesid}
									onChange={(e) => setModalidadesid(Number(e.target.value))}
								>
									{modalidades.map((modalidad) => (
										<option key={modalidad.id} value={modalidad.id}>
											{modalidad.name}
										</option>
									))}
								</select>
								{errors.modalidadesid && (
									<p className="text-sm text-red-500">
										Este campo es obligatorio.
									</p>
								)}
							</div>
							<div className="w-full">
								<label className="text-primary text-sm font-medium md:text-lg">
									Categoría
								</label>
								<select
									className="bg-background mt-1 w-full rounded border p-2 text-sm text-white md:text-base"
									value={categoryid}
									onChange={(e) => setCategoryid(Number(e.target.value))}
								>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
								{errors.categoryid && (
									<p className="text-sm text-red-500">
										Este campo es obligatorio.
									</p>
								)}
							</div>
							{editingCourseId && (
								<>
									<div className="w-full">
										<label className="text-primary text-sm font-medium md:text-lg">
											Tipo de Curso
										</label>
										<CourseTypeDropdown
											courseTypeId={courseTypeId}
											setCourseTypeId={setCourseTypeId}
										/>
									</div>
									<div className="w-full">
										<label className="text-primary text-sm font-medium md:text-lg">
											Estado del Curso
										</label>
										<ActiveDropdown
											isActive={isActive}
											setIsActive={setIsActive}
										/>
									</div>
								</>
							)}
						</div>
						<div>
							<label
								htmlFor="rating"
								className="text-primary text-sm font-medium md:text-lg"
							>
								Rating
							</label>
							<Input
								type="number"
								min="0"
								max="5"
								step="0.1"
								placeholder="0-5"
								className="border-primary mt-1 w-full rounded border p-2 text-sm text-white outline-none focus:no-underline md:text-base"
								value={isNaN(rating) ? '' : rating}
								onChange={(e) => setRating(Number(e.target.value))}
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="instructor"
								className="text-primary text-sm font-medium md:text-lg"
							>
								Instructor
							</label>
							<select
								id="instructor"
								value={instructor}
								onChange={(e) => setInstructor(e.target.value)}
								className="border-primary bg-background w-full rounded border p-2 text-sm text-white outline-none md:text-base"
							>
								<option value="">Seleccionar instructor</option>
								{educators?.map((educator) => (
									<option key={educator.id} value={educator.id}>
										{educator.name}
									</option>
								))}
							</select>
						</div>
						<div className="w-full px-2 md:px-0">
							<label className="text-primary text-sm font-medium md:text-lg">
								Imagen de portada
							</label>
							<div
								className={`mx-auto mt-2 w-full rounded-lg border-2 border-dashed p-4 md:w-[80%] md:p-8 ${
									isDragging
										? 'border-blue-500 bg-blue-50'
										: errors.file
											? 'border-red-500 bg-red-50'
											: 'border-gray-300 bg-gray-50'
								}`}
							>
								<div className="text-center">
									{!file && coverImage ? (
										<div className="relative overflow-hidden rounded-lg bg-gray-100">
											<Image
												src={`${process.env.NEXT_PUBLIC_AWS_S3_URL ?? ''}/${coverImage}`}
												alt="current cover"
												width={500}
												height={200}
												className="h-48 w-full object-cover"
											/>
											<button
												onClick={() => {
													setCoverImage(null);
													setErrors((prev) => ({ ...prev, file: true }));
												}}
												className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
											>
												<MdClose className="z-20 size-5" />
											</button>
										</div>
									) : !file ? (
										<>
											<FiUploadCloud
												className={`mx-auto size-12 ${errors.file ? 'text-red-500' : 'text-primary'}`}
											/>
											<h2 className="mt-4 text-xl font-medium text-gray-700">
												Arrastra y suelta tu imagen aquí
											</h2>
											<p className="mt-2 text-sm text-gray-500">
												o haz clic para seleccionar un archivo desde tu
												computadora
											</p>
											<p className="mt-1 text-sm text-gray-500">
												Supports: JPG, PNG, GIF (Max size: 5MB)
											</p>
											<input
												type="file"
												accept="image/*"
												className={`hidden ${errors.file ? 'bg-red-500' : 'bg-primary'}`}
												onChange={handleFileChange}
												id="file-upload"
											/>
											<label
												htmlFor="file-upload"
												className={`mt-4 inline-flex cursor-pointer items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${errors.file ? 'bg-red-500' : 'bg-primary'}`}
											>
												Seleccionar Archivo
											</label>
										</>
									) : (
										<div className="relative overflow-hidden rounded-lg bg-gray-100">
											<Image
												src={URL.createObjectURL(file)}
												alt="preview"
												width={500}
												height={200}
												className="h-48 w-full object-cover"
											/>
											<button
												onClick={() => {
													setFile(null);
													setFileName(null);
													setFileSize(null);
													setErrors((prev) => ({ ...prev, file: true }));
												}}
												className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
											>
												<MdClose className="z-20 size-5" />
											</button>
											<div className="flex justify-between p-2">
												<p className="truncate text-sm text-gray-500">
													{fileName}
												</p>
												<p className="text-sm text-gray-500">
													{((fileSize ?? 0) / 1024).toFixed(2)} KB
												</p>
											</div>
										</div>
									)}
									{errors.file && (
										<p className="text-sm text-red-500">
											Este campo es obligatorio.
										</p>
									)}
								</div>
							</div>
						</div>
						<div className="mt-6 flex flex-col text-white">
							<p>
								¿Es calificable? {editingCourseId ? 'actualizar' : 'agregar'}{' '}
								parametros
							</p>
							<div className="flex space-x-2">
								<label
									htmlFor="toggle"
									className="relative inline-block h-8 w-16"
								>
									<input
										type="checkbox"
										id="toggle"
										checked={addParametros}
										onChange={handleToggleParametro}
										className="absolute size-0"
									/>
									<span
										className={`size-1/2 cursor-pointer rounded-full transition-all duration-300 ${addParametros ? 'bg-gray-300' : 'bg-red-500'}`}
									>
										<span
											className={`bg-primary absolute top-1 left-1 size-6 rounded-full transition-all duration-300 ${addParametros ? 'translate-x-8' : 'translate-x-0'}`}
										/>
									</span>
								</label>
								<span className="mt-1 text-sm text-gray-400">
									{addParametros ? 'Si' : 'No'}
								</span>
							</div>
						</div>
						{addParametros && (
							<div className="space-y-3 md:space-y-4">
								<label className="text-primary text-sm font-medium md:text-lg">
									Parámetros de evaluación
								</label>
								<Button
									onClick={handleAddParametro}
									disabled={parametros.length >= 10}
									className="bg-primary mt-2 w-10/12 text-white lg:w-1/2"
								>
									{editingCourseId ? 'Editar o agregar' : 'Agregar'} nuevo
									parametro
									<Plus />
								</Button>
								{parametros.map((parametro, index) => (
									<div key={index} className="mt-4 rounded-lg border p-4">
										<div className="flex items-center justify-between">
											<h3 className="text-primary text-sm font-medium md:text-lg">
												Parámetro {index + 1}
											</h3>
											<Button
												variant="destructive"
												onClick={() => handleRemoveParametro(index)}
											>
												Eliminar
											</Button>
										</div>
										<label className="text-primary mt-2 text-sm font-medium md:text-lg">
											Nombre
										</label>
										<input
											type="text"
											value={parametro.name}
											onChange={(e) =>
												handleParametroChange(index, 'name', e.target.value)
											}
											className="mt-1 w-full rounded border p-2 text-sm text-white outline-none md:text-base"
										/>
										<label className="text-primary mt-2 text-sm font-medium md:text-lg">
											Descripción
										</label>
										<textarea
											value={parametro.description}
											onChange={(e) =>
												handleParametroChange(
													index,
													'description',
													e.target.value
												)
											}
											className="mt-1 w-full rounded border p-2 text-sm text-white outline-none md:text-base"
										/>
										<label className="text-primary mt-2 text-sm font-medium md:text-lg">
											Porcentaje %
										</label>
										<input
											type="number"
											value={parametro.porcentaje}
											onChange={(e) =>
												handleParametroChange(
													index,
													'porcentaje',
													Math.max(1, Math.min(100, parseFloat(e.target.value)))
												)
											}
											className="mt-1 w-full rounded border p-2 text-sm text-white outline-none md:text-base"
										/>
									</div>
								))}
							</div>
						)}
						{isOpen && (
							<div className="my-4 flex flex-col">
								<label
									htmlFor="subjects"
									className="text-primary text-sm font-medium md:text-lg"
								>
									Asignar Mateias
								</label>
								<Select
									isMulti
									value={Array.from(
										new Map(
											allSubjects
												.filter((subject) =>
													subjects.some((s) => s.id === subject.id)
												)
												.map((subject) => [subject.title, subject])
										).values()
									).map((subject) => ({
										value: subject.id.toString(),
										label: subject.title,
									}))}
									options={Array.from(
										new Map(
											allSubjects.map((subject) => [subject.title, subject])
										).values()
									).map((subject) => ({
										value: subject.id.toString(),
										label: subject.title,
									}))}
									onChange={(
										newValue: MultiValue<{ value: string; label: string }>
									) => {
										const selectedSubjects = newValue.map((option) => ({
											id: Number(option.value),
										}));
										setSubjects(selectedSubjects);
									}}
									classNamePrefix="react-select"
									className="mt-2 w-10/12 lg:w-1/2"
								/>
							</div>
						)}
						{(uploading || isUploading) && (
							<div className="mt-4">
								<Progress
									value={uploading ? progress : uploadProgress}
									className="w-full"
								/>
								<p className="mt-2 text-center text-sm text-gray-500">
									{uploading ? progress : uploadProgress}% Completado
								</p>
							</div>
						)}
					</div>
				</div>
				<DialogFooter className="mt-4 grid grid-cols-2 gap-2 md:gap-4">
					<Button
						onClick={handleCancel}
						className="w-full border-transparent bg-gray-600 p-2 text-sm md:p-3 md:text-base"
					>
						Cancelar
					</Button>
					<Button
						onClick={handleSubmit}
						className="w-full bg-green-400 text-sm md:text-base"
						disabled={uploading}
					>
						{uploading
							? 'Subiendo...'
							: editingCourseId
								? isEditing
									? 'Editando...'
									: 'Editar'
								: 'Crear Curso'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ModalFormCourse;
