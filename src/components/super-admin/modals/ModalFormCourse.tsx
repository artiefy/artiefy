'use client';

import { useEffect, useState, type ChangeEvent } from 'react';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs';
import { FiUploadCloud } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';

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
import CategoryDropdown from '~/components/super-admin/layout/CategoryDropdown';
import DificultadDropdown from '~/components/super-admin/layout/DifiultadDropdown';
import ModalidadDropdown from '~/components/super-admin/layout/ModalidadDropdown';

interface CourseFormProps {
	onSubmitAction: (
		id: string | number,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		dificultadesid: number,
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
	isOpen: boolean;
	onCloseAction: () => void;
}

export default function ModalFormCourse({
	onSubmitAction,
	uploading,
	editingCourseId,
	isOpen,
	onCloseAction,
	coverImageKey,
}: CourseFormProps) {
	const { user } = useUser();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [requerimientos, setRequerimientos] = useState('');
	const [categoryid, setCategoryid] = useState(0);
	const [modalidadesid, setModalidadesid] = useState(0);
	const [dificultadid, setDificultadid] = useState(0);
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

	const handleSubmit = async () => {
		console.log('Intentando enviar el curso...');

		const controller = new AbortController();
		setUploadController(controller);

		const newErrors = {
			title: !title.trim(),
			description: !description.trim(),
			categoryid: categoryid === 0,
			modalidadesid: modalidadesid === 0,
			dificultadid: dificultadid === 0,
			requerimientos: !requerimientos.trim(),
			file: !editingCourseId && !file && !currentCoverImageKey, // Solo validar si NO está editando
		};

		console.log('Errores detectados:', newErrors);

		if (Object.values(newErrors).some((error) => error)) {
			setErrors({
				...newErrors,
				category: false,
				dificultad: false,
				modalidad: false,
			});
			return;
		}

		setIsUploading(true);
		try {
			console.log('Datos enviados:', {
				title,
				description,
				categoryid,
				modalidadesid,
				dificultadid,
				requerimientos,
				file: file ? file.name : 'No file',
			});

			await onSubmitAction(
				editingCourseId ?? '', // ✅ Mantiene `number` o `string`, evita forzar `string`
				title,
				description,
				file,
				categoryid,
				modalidadesid,
				dificultadid,
				requerimientos
			);

			console.log('Curso creado/actualizado con éxito.');
			setIsUploading(false);
			onCloseAction(); // Cerrar modal después de crear
		} catch (error) {
			console.error('Error al enviar el curso:', error);
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
			case 'dificultadesid':
				setDificultadid(value as number);
				break;
			case 'file':
				setFile(value as File);
				break;
		}
	};

	useEffect(() => {
		if (modifiedFields.size > 0) {
			console.log('Campos modificados:', modifiedFields);
		}
	}, [modifiedFields]);

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
				<div className="bg-background rounded-lg px-6 text-black shadow-md">
					<label htmlFor="title" className="text-primary text-lg font-medium">
						Título
					</label>
					<input
						type="text"
						placeholder="Título"
						value={title}
						onChange={(e) => handleFieldChange('title', e.target.value)}
						className={`text-primary text-se mb-4 w-full rounded border p-2 outline-hidden ${errors.title ? 'border-red-500' : 'border-primary'}`}
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
						value={description}
						onChange={(e) => handleFieldChange('description', e.target.value)}
						className={`text-primary mb-3 h-auto w-full rounded border p-2 outline-hidden ${errors.description ? 'border-red-500' : 'border-primary'}`}
					/>
					{errors.description && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					<label
						htmlFor="requerimientos"
						className="text-primary text-lg font-medium"
					>
						Requerimientos previos
					</label>
					<textarea
						placeholder="Escriba en esta zona los requerimientos o conocimientos previos para el curso"
						value={requerimientos}
						onChange={(e) =>
							handleFieldChange('requerimientos', e.target.value)
						}
						className={`text-primary mb-3 h-auto w-full rounded border p-2 outline-hidden ${errors.requerimientos ? 'border-red-500' : 'border-primary'}`}
					/>
					{errors.requerimientos && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<div className="mx-auto flex flex-col justify-center">
							<label
								htmlFor="dificultadid"
								className="text-primary justify-center text-center text-lg font-medium"
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
								className="text-primary justify-center text-center text-lg font-medium"
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
								className="text-primary justify-center text-center text-lg font-medium"
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
						className="text-primary text-lg font-medium"
					>
						Educador
					</label>
					<div className="border-primary mb-4 w-full rounded border p-2">
						<h3 className="text-primary text-lg font-medium">
							Educador: {user?.fullName}
						</h3>
					</div>
					<label htmlFor="file" className="text-primary text-lg font-medium">
						Imagen de portada
					</label>
					<div
						className={`border-primary mx-auto mt-5 w-80 rounded-lg border-2 border-dashed p-8 lg:w-1/2 ${
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
										className={`mt-4 inline-flex cursor-pointer items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-xs hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-hidden ${errors.file ? 'bg-red-500' : 'bg-primary'}`}
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
										<p className="truncate text-sm text-gray-500">{fileName}</p>
										<p className="text-sm text-gray-500">
											{((fileSize ?? 0) / 1024).toFixed(2)} KB
										</p>
									</div>
								</div>
							)}
						</div>
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
				{errors.file && (
					<p className="text-sm text-red-500">Este campo es obligatorio.</p>
				)}
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
}
