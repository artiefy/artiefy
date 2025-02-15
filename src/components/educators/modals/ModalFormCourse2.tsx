'use client';
import { useEffect, useState, type ChangeEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { FiUploadCloud } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import CategoryDropdown from '~/components/educators/layout/CategoryDropdown';
import DificultadDropdown from '~/components/educators/layout/DifiultadDropdown';
import ModalidadDropdown from '~/components/educators/layout/ModalidadDropdown';
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
import { toast } from '~/hooks/use-toast';

interface CourseFormProps {
	onSubmitAction: (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		dificultadid: number,
		requerimientos: string,
		options?: { signal: AbortSignal }
	) => Promise<void>;
	uploading: boolean;
	editingCourseId: number | null;
	title: string;
	setTitle: (title: string) => void;
	description: string;
	setDescription: (description: string) => void;
	requerimientos: string;
	setRequerimientos: (requerimientos: string) => void;
	categoryid: number;
	setCategoryid: (categoryid: number) => void;
	modalidadesid: number;
	setModalidadesid: (modalidadesid: number) => void;
	dificultadid: number;
	setDificultadid: (dificultadid: number) => void;
	coverImageKey: string;
	setCoverImageKey: (coverImageKey: string) => void;
	parametros: {
		id: number;
		name: string;
		description: string;
		porcentaje: number;
		entrega: number;
	}[];
	setParametrosAction: (
		parametros: {
			id: number;
			name: string;
			description: string;
			porcentaje: number;
			entrega: number;
		}[]
	) => void;
	isOpen: boolean;
	onCloseAction: () => void;
}

const ModalFormCourse: React.FC<CourseFormProps> = ({
	onSubmitAction,
	uploading,
	editingCourseId,
	title,
	setTitle,
	description,
	setDescription,
	requerimientos,
	setRequerimientos,
	categoryid,
	setCategoryid,
	modalidadesid,
	setModalidadesid,
	dificultadid,
	setDificultadid,
	coverImageKey,
	parametros = [], // Asegúrate de que no sea undefined
	setParametrosAction,
	isOpen,
	onCloseAction,
}) => {
	const { user } = useUser();
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [fileSize, setFileSize] = useState<number | null>(null);
	const [progress, setProgress] = useState(0);
	const [isEditing, setIsEditing] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [errors, setErrors] = useState({
		title: false,
		description: false,
		categoryid: false,
		category: false,
		modalidadesid: false,
		dificultadid: false,
		file: false,
		dificultad: false,
		modalidad: false,
		requerimientos: false,
	});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
	const [currentCoverImageKey] = useState(coverImageKey);
	const [uploadController, setUploadController] =
		useState<AbortController | null>(null);
	const [coverImage, setCoverImageKey] = useState<string | null>(null);

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
		console.log('coverImageKey', coverImage);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		const files = e.dataTransfer.files;
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
	};

	const handleAddParametro = () => {
		if (parametros.length < 10) {
			setParametrosAction([
				...parametros.map((parametro, index) => ({
					...parametro,
					id: index + 1,
				})),
				{
					id: parametros.length + 1,
					name: '',
					description: '',
					porcentaje: 0,
					entrega: parametros.length + 1,
				},
			]);
		}
	};

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
		setParametrosAction(
			updatedParametros.map((parametro, index) => ({
				...parametro,
				id: index + 1,
			}))
		);
	};

	const handleRemoveParametro = (index: number) => {
		const updatedParametros = parametros.filter((_, i) => i !== index);
		// Reasignar los valores de entrega
		const reassignedParametros = updatedParametros.map((parametro, i) => ({
			id: parametro.id,
			name: parametro.name,
			description: parametro.description,
			porcentaje: parametro.porcentaje,
			entrega: i + 1,
		}));
		setParametrosAction(reassignedParametros);
	};

	const handleSubmit = async () => {
		const controller = new AbortController();
		setUploadController(controller);
		const newErrors = {
			title: !editingCourseId && !title,
			description: !editingCourseId && !description,
			categoryid: !editingCourseId && !categoryid,
			category: false,
			modalidadesid: !editingCourseId && !modalidadesid,
			dificultadid: !editingCourseId && !dificultadid,
			dificultad: false,
			file: !editingCourseId && !file && !currentCoverImageKey,
			modalidad: false,
			requerimientos: !editingCourseId && !requerimientos,
		};

		if (editingCourseId) {
			newErrors.title = modifiedFields.has('title') && !title;
			newErrors.description = modifiedFields.has('description') && !description;
			newErrors.dificultadid = modifiedFields.has('dificultadid')
				? !dificultadid
				: !!newErrors.dificultadid;
			newErrors.file = modifiedFields.has('file') && !file;
			newErrors.modalidadesid =
				modifiedFields.has('modalidadesid') && !modalidadesid;
			newErrors.requerimientos =
				modifiedFields.has('requerimientos') && !requerimientos;
		}

		// Validar que cada porcentaje esté entre 1 y 100
		const porcentajeInvalido = parametros.some(
			(parametro) => parametro.porcentaje < 1 || parametro.porcentaje > 100
		);
		if (porcentajeInvalido) {
			toast({
				title: 'Error',
				description: 'Cada porcentaje debe estar entre 1 y 100%',
				variant: 'destructive',
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
			await onSubmitAction(
				editingCourseId ? editingCourseId.toString() : '',
				title,
				description,
				file,
				categoryid,
				modalidadesid,
				dificultadid,
				requerimientos,
				{ signal: controller.signal }
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

	const handleCancel = () => {
		if (uploadController) {
			uploadController.abort();
		}
		onCloseAction();
	};

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
			case 'requerimientos':
				setRequerimientos(value as string);
				break;
			case 'categoryid':
				setCategoryid(value as number);
				break;
			case 'modalidadesid':
				setModalidadesid(value as number);
				break;
			case 'dificultadid':
				setDificultadid(value as number);
				break;
			case 'file':
				setFile(value as File);
				break;
		}
	};

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
			}, 50); // Ajusta el intervalo según sea necesario
			return () => clearInterval(interval);
		}
	}, [uploading]);

	useEffect(() => {
		if (progress === 100) {
			const timeout = setTimeout(() => {
				setProgress(0);
			}, 500);

			return () => clearTimeout(timeout);
		}
	}, [progress]);

	useEffect(() => {
		if (!uploading && isEditing) {
			setIsEditing(false);
		}
	}, [uploading, isEditing]);

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

	useEffect(() => {
		// Inicializar los valores del formulario con los valores de edición
		if (editingCourseId) {
			setTitle(title);
			setDescription(description);
			setRequerimientos(requerimientos);
			setCategoryid(categoryid);
			setModalidadesid(modalidadesid);
			setDificultadid(dificultadid);
			setCoverImageKey(coverImageKey);
		}
	}, [editingCourseId]);

	useEffect(() => {
		if (isOpen) {
			setTitle(title);
			setDescription(description);
			setRequerimientos(requerimientos);
			setCategoryid(categoryid);
			setModalidadesid(modalidadesid);
			setDificultadid(dificultadid);
			setCoverImageKey(coverImageKey);
			setParametrosAction(parametros);
		}
	}, [
		isOpen,
		title,
		description,
		requerimientos,
		categoryid,
		modalidadesid,
		dificultadid,
		coverImageKey,
		parametros,
		setTitle,
		setDescription,
		setRequerimientos,
		setCategoryid,
		setModalidadesid,
		setDificultadid,
		setCoverImageKey,
		setParametrosAction,
	]);

	return (
		<Dialog open={isOpen} onOpenChange={onCloseAction}>
			<DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
				<DialogHeader className="mt-4">
					<DialogTitle className="text-4xl">
						{editingCourseId ? 'Editar Curso' : 'Crear Curso'}
					</DialogTitle>
					<DialogDescription className="text-xl text-white">
						{editingCourseId
							? 'Edita los detalles del curso'
							: 'Llena los detalles para crear un nuevo curso'}
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-lg bg-background px-6 text-black shadow-md">
					<label htmlFor="title" className="text-lg font-medium text-primary">
						Título
					</label>
					<input
						type="text"
						placeholder="Título"
						value={title}
						onChange={(e) => handleFieldChange('title', e.target.value)}
						className={`mb-4 w-full rounded border p-2 text-black outline-none ${errors.title ? 'border-red-500' : 'border-primary'}`}
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
						value={description}
						onChange={(e) => handleFieldChange('description', e.target.value)}
						className={`mb-3 h-auto w-full rounded border p-2 text-black outline-none ${errors.description ? 'border-red-500' : 'border-primary'}`}
					/>
					{errors.description && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					<label
						htmlFor="requerimientos"
						className="text-lg font-medium text-primary"
					>
						Requerimientos previos
					</label>
					<textarea
						placeholder="Escriba en esta zona los requerimientos o conocimientos previos para el curso"
						value={requerimientos}
						onChange={(e) =>
							handleFieldChange('requerimientos', e.target.value)
						}
						className={`mb-3 h-auto w-full rounded border p-2 text-black outline-none ${errors.requerimientos ? 'border-red-500' : 'border-primary'}`}
					/>
					{errors.requerimientos && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<div className="mx-auto flex flex-col justify-center">
							<label
								htmlFor="dificultadid"
								className="justify-center text-center text-lg font-medium text-primary"
							>
								Dificultad
							</label>
							<DificultadDropdown
								dificultad={dificultadid}
								setDificultad={setDificultadid}
								errors={errors}
							/>
							{errors.dificultadid && (
								<p className="text-sm text-red-500">
									Este campo es obligatorio.
								</p>
							)}
						</div>
						<div className="mx-auto flex flex-col justify-center">
							<label
								htmlFor="modalidadesid"
								className="justify-center text-center text-lg font-medium text-primary"
							>
								Modalidad
							</label>
							<ModalidadDropdown
								modalidad={modalidadesid}
								setModalidad={setModalidadesid}
								errors={errors}
							/>
							{errors.modalidadesid && (
								<p className="text-sm text-red-500">
									Este campo es obligatorio.
								</p>
							)}
						</div>
						<div className="mx-auto flex flex-col justify-center">
							<label
								htmlFor="categoryid"
								className="justify-center text-center text-lg font-medium text-primary"
							>
								Categoría
							</label>
							<CategoryDropdown
								category={categoryid}
								setCategory={setCategoryid}
								errors={errors}
							/>
							{errors.categoryid && (
								<p className="text-sm text-red-500">
									Este campo es obligatorio.
								</p>
							)}
						</div>
					</div>
					<label
						htmlFor="instructor"
						className="text-lg font-medium text-primary"
					>
						Instructor
					</label>
					<div className="mb-4 w-full rounded border border-primary p-2">
						<h3 className="text-lg font-medium text-primary">
							Instructor: {user?.fullName}
						</h3>
					</div>
					<label htmlFor="file" className="text-lg font-medium text-primary">
						Imagen de portada
					</label>
					<div
						className={`mx-auto mt-5 w-80 rounded-lg border-2 border-dashed border-primary p-8 lg:w-1/2 ${
							isDragging
								? 'border-blue-500 bg-blue-50'
								: errors.file
									? 'border-red-500 bg-red-50'
									: 'border-gray-300 bg-gray-50'
						} transition-all duration-300 ease-in-out`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					>
						<div className="text-center">
							{!file ? (
								<>
									<FiUploadCloud
										className={`mx-auto size-12 ${errors.file ? 'text-red-500' : 'text-primary'} `}
									/>
									<h2 className="mt-4 text-xl font-medium text-gray-700">
										Arrastra y suelta tu imagen aquí
									</h2>
									<p className="mt-2 text-sm text-gray-500">
										o haz clic para seleccionar un archivo desde tu computadora
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
										className={`mt-4 inline-flex cursor-pointer items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${errors.file ? 'bg-red-500' : 'bg-primary'}`}
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
										className="absolute right-2 top-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
									>
										<MdClose className="z-20 size-5" />
									</button>
									<div className="flex justify-between p-2">
										<p className="truncate text-sm text-gray-500">{fileName}</p>
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
					<div className="my-4 flex flex-col">
						<label
							htmlFor="totalParametros"
							className="text-lg font-medium text-primary"
						>
							Parametros de evaluación
						</label>
						<Button
							onClick={handleAddParametro}
							disabled={parametros.length >= 10} // Verifica que parametros no sea undefined
							className="w-10/12 lg:w-1/4"
						>
							{editingCourseId ? 'Editar' : 'Agregar'} parametro
							<Plus />
						</Button>
						{parametros.map((parametro, index) => (
							<div key={index} className="mt-4 rounded-lg border p-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-medium text-primary">
										Parámetro {index + 1}
									</h3>
									<Button
										variant="destructive"
										onClick={() => handleRemoveParametro(index)}
									>
										Eliminar
									</Button>
								</div>
								<label className="mt-2 text-lg font-medium text-primary">
									Nombre
								</label>
								<input
									type="text"
									value={parametro.name}
									onChange={(e) =>
										handleParametroChange(index, 'name', e.target.value)
									}
									className="mt-1 w-full rounded border p-2 text-black outline-none"
								/>
								<label className="mt-2 text-lg font-medium text-primary">
									Descripción
								</label>
								<textarea
									value={parametro.description}
									onChange={(e) =>
										handleParametroChange(index, 'description', e.target.value)
									}
									className="mt-1 w-full rounded border p-2 text-black outline-none"
								/>
								<label className="mt-2 text-lg font-medium text-primary">
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
									className="mt-1 w-full rounded border p-2 text-black outline-none"
								/>
							</div>
						))}
					</div>
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
				<DialogFooter className="mt-4 grid grid-cols-2 gap-4">
					<Button
						onClick={handleCancel}
						className="mr-2 w-full border-transparent bg-gray-600 p-3 text-white hover:bg-gray-700"
					>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} variant="save" disabled={uploading}>
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
