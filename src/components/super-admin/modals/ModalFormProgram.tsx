import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { FiUploadCloud } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import { toast } from 'sonner';
import CategoryDropdown from '~/components/educators/layout/CategoryDropdown';
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
import { type ProgramDetails as Program } from '~/models/super-adminModels/programModelsSuperAdmin';

interface ModalFormProgramProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        id: string,
        title: string,
        description: string,
        file: File | null,
        categoryid: number,
        rating: number,
        coverImageKey: string,
        fileName: string
    ) => Promise<void>;
    uploading: boolean;
    editingProgramId: number | null;
    title: string;
    setTitle: (title: string) => void;
    description: string;
    setDescription: (description: string) => void;
    categoryid: number;
    setCategoryid: (categoryid: number) => void;
    coverImageKey: string;
    setCoverImageKey: (coverImageKey: string) => void;
    rating: number;
    setRating: (rating: number) => void;
}
const ModalFormProgram: React.FC<ModalFormProgramProps> = ({
	onSubmit,
	uploading,
	editingProgramId,
	title,
	setTitle,
	description,
	setDescription,
	rating,
	setRating,
	categoryid,
	setCategoryid,
	coverImageKey,
	isOpen,
	onClose,
}) => {
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
		rating: false,
		file: false,
	});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
	const [currentCoverImageKey] = useState(coverImageKey);
	const [uploadController, setUploadController] =
		useState<AbortController | null>(null);
	const [coverImage, setCoverImage] = useState<string | null>(null);

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

	const handleSubmit = async () => {
		const controller = new AbortController();
		setUploadController(controller);
		const newErrors = {
			title: !editingProgramId && !title,
			description: !editingProgramId && !description,
			categoryid: !editingProgramId && !categoryid,
			category: false,
			rating: !editingProgramId && !rating,
			file: !editingProgramId && !file && !currentCoverImageKey,
		};

		if (editingProgramId) {
			newErrors.title = modifiedFields.has('title') && !title;
			newErrors.description = modifiedFields.has('description') && !description;
			newErrors.categoryid = modifiedFields.has('categoryid') && !categoryid;
			newErrors.rating = modifiedFields.has('rating') && !rating;
			newErrors.file = modifiedFields.has('file') && !file;
		}

		setErrors(newErrors);

		if (Object.values(newErrors).some((error) => error)) {
			console.log('Validation errors:', newErrors);
			return;
		}

		setIsEditing(true);
		setIsUploading(true);
		try {
			let coverImageKey = currentCoverImageKey ?? '';
			let uploadedFileName = fileName ?? '';

			if (file) {
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

			await onSubmit(
				editingProgramId ? editingProgramId.toString() : '',
				title,
				description,
				file,
				categoryid,
				rating,
				coverImageKey,
				uploadedFileName
			);
			if (controller.signal.aborted) {
				console.log('Upload cancelled');
				return;
			}

			setIsUploading(false);
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				console.log('Upload cancelled');
				return;
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
		onClose();
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
			case 'categoryid':
				setCategoryid(value as number);
				break;
			case 'rating':
				setRating(value as number);
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
			}, 50);
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
					return prev + 10;
				});
			}, 500);

			return () => clearInterval(interval);
		}
	}, [isUploading]);

	useEffect(() => {
		if (editingProgramId) {
			setTitle(title);
			setDescription(description);
			setCategoryid(categoryid);
			setRating(rating);
			setCoverImage(coverImageKey);
		}
	}, [editingProgramId]);

	useEffect(() => {
		if (isOpen && !editingProgramId) {
			setTitle('');
			setDescription('');
			setCategoryid(0);
			setRating(0);
			setCoverImage('');
		}
	}, [isOpen, editingProgramId]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[90vh] max-w-full overflow-y-auto">
				<DialogHeader className="mt-4">
					<DialogTitle className="text-4xl">
						{editingProgramId ? 'Editar Programa' : 'Crear Programa'}
					</DialogTitle>
					<DialogDescription className="text-xl text-white">
						{editingProgramId
							? 'Edita los detalles del programa'
							: 'Llena los detalles para crear un nuevo programa'}
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
						className={`mb-4 w-full rounded border p-2 text-white outline-none ${errors.title ? 'border-red-500' : 'border-primary'}`}
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
						className={`mb-3 h-auto w-full rounded border p-2 text-white outline-none ${errors.description ? 'border-red-500' : 'border-primary'}`}
					/>
					{errors.description && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
					<div>
						<label
							htmlFor="rating"
							className="text-primary text-lg font-medium"
						>
							Rating
						</label>
						<Input
							type="number"
							min="0"
							max="5"
							step="0.1"
							placeholder="0-5"
							className="border-primary mt-1 w-full rounded border p-2 text-white outline-none focus:no-underline"
							value={rating}
							onChange={(e) => setRating(Number(e.target.value))}
						/>
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
					<Button
						onClick={handleSubmit}
						className="bg-green-400 text-white hover:bg-green-400/70"
						disabled={uploading}
					>
						{uploading
							? 'Subiendo...'
							: editingProgramId
								? isEditing
									? 'Editando...'
									: 'Editar'
								: 'Crear Programa'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ModalFormProgram;

