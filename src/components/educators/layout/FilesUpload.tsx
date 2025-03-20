'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';

import { FilePlus2, FileVideo, Image as ImageIcon } from 'lucide-react';
import { MdClose } from 'react-icons/md';

// Propiedades del componente para subir archivos
interface FileUploadProps {
	type: 'image' | 'video' | 'file';
	label: string;
	accept: string;
	maxSize: number; // en MB
	_required?: boolean;
	multiple?: boolean;
	onFileChange: (file: File | File[] | null | undefined) => void;
	tipo: string;
	file?: File; // Agregar la propiedad file
}

const FileUpload: React.FC<FileUploadProps> = ({
	type,
	label,
	accept,
	maxSize,
	_required = false,
	multiple = false,
	onFileChange,
	tipo,
	file, 
}) => {
	const [files, setFiles] = useState<File[]>([]); // Cambiar el estado de files a un array de archivos
	const [fileNames, setFileNames] = useState<string[]>([]); // Cambiar el estado de fileNames a un array de strings
	const [fileSizes, setFileSizes] = useState<number[]>([]); // Cambiar el estado de fileSizes a un array de números
	const [isDragging, setIsDragging] = useState(false); // Cambiar el estado de isDragging a un booleano
	const [errors, setErrors] = useState(''); // Cambiar el estado de errors a un string

	// Efecto para manejar el archivo
	useEffect(() => {
		if (file) {
			setFiles([file]);
			setFileNames([file.name]);
			setFileSizes([file.size]);
		}
	}, [file]);

	// Función para manejar el cambio de archivo en el input y validar el archivo
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files ?? []);
		const validFileTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		];

		if (
			multiple &&
			selectedFiles.length + files.length > 5 &&
			type === 'file'
		) {
			setErrors('No puedes subir más de 5 archivos.');
			return;
		}

		const validFiles = selectedFiles.filter(
			(file) =>
				file.size / (1024 * 1024) <= maxSize &&
				(type !== 'file' || validFileTypes.includes(file.type))
		);

		if (validFiles.length !== selectedFiles.length) {
			setErrors(
				'Algunos archivos no son del tipo permitido o superan el tamaño máximo permitido.'
			);
			return;
		}

		setFiles((prev) => [...prev, ...validFiles]);
		setFileNames((prev) => [...prev, ...validFiles.map((file) => file.name)]);
		setFileSizes((prev) => [...prev, ...validFiles.map((file) => file.size)]);
		setErrors('');
		onFileChange(multiple ? [...files, ...validFiles] : validFiles[0]);
	};

	// Función para manejar el arrastre de archivos
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	// Función para manejar el arrastre de archivos
	const handleDragLeave = () => {
		setIsDragging(false);
	};

	// Función para manejar el arrastre de archivos
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const selectedFiles = Array.from(e.dataTransfer.files ?? []);
		const validFileTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		];

		if (
			multiple &&
			selectedFiles.length + files.length > 5 &&
			type === 'file'
		) {
			setErrors('No puedes subir más de 5 archivos.');
			return;
		}

		const validFiles = selectedFiles.filter(
			(file) =>
				file.size / (1024 * 1024) <= maxSize &&
				(type !== 'file' || validFileTypes.includes(file.type))
		);

		if (validFiles.length !== selectedFiles.length) {
			setErrors(
				'Algunos archivos no son del tipo permitido o superan el tamaño máximo permitido.'
			);
			return;
		}

		setFiles((prev) => [...prev, ...validFiles]);
		setFileNames((prev) => [...prev, ...validFiles.map((file) => file.name)]);
		setFileSizes((prev) => [...prev, ...validFiles.map((file) => file.size)]);
		setErrors('');
		onFileChange(multiple ? [...files, ...validFiles] : validFiles[0]);
	};

	// Función para manejar la eliminación de archivos
	const handleRemoveFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
		setFileNames((prev) => prev.filter((_, i) => i !== index));
		setFileSizes((prev) => prev.filter((_, i) => i !== index));
		setErrors('');
		onFileChange(files.length > 1 ? files.filter((_, i) => i !== index) : null);
	};

	// Retorno la vista del componente
	return (
		<div className="flex flex-col items-center">
			<label className="text-center text-lg font-medium text-primary">
				{label}
			</label>
			<div
				className={`mt-2 w-4/5 rounded-lg border-2 border-dashed p-8 ${
					isDragging
						? 'border-blue-500 bg-blue-50'
						: errors
							? 'border-red-500 bg-red-50'
							: 'border-gray-300 bg-gray-50'
				} transition-all duration-300 ease-in-out`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				{!files.length ? (
					<div className="text-center">
						<div className="mx-auto size-16 rounded-full bg-primary pt-2">
							{type === 'image' && (
								<ImageIcon className="mx-auto size-12 text-white" />
							)}
							{type === 'video' && (
								<FileVideo className="mx-auto size-12 text-white" />
							)}
							{type === 'file' && (
								<FilePlus2 className="mx-auto size-12 text-white" />
							)}
						</div>

						<h2 className="mt-4 text-xl font-medium text-gray-700">
							Arrastra y suelta tu archivo aquí
						</h2>
						<p className="mt-2 text-sm text-gray-500">
							o haz clic para seleccionar un archivo desde tu computadora
						</p>
						<p className="mt-1 text-sm text-gray-500">
							Soporta: {accept} (Tamaño máx: {maxSize}MB)
						</p>
						<input
							type="file"
							accept={accept}
							className="hidden"
							onChange={handleFileChange}
							id={`file-upload-${type}`}
							multiple={type === 'file'} // Permitir múltiples archivos solo si el tipo es file
						/>
						<label
							htmlFor={`file-upload-${type}`}
							className="mt-4 inline-flex cursor-pointer items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
						>
							Seleccionar {tipo}
						</label>
					</div>
				) : (
					<>
						{type === 'image' && files.length === 1 && (
							<div className="relative overflow-hidden rounded-lg bg-gray-100">
								<Image
									src={files[0] ? URL.createObjectURL(files[0]) : ''}
									alt="preview"
									width={500}
									height={200}
									className="h-48 w-full object-cover"
								/>
								<button
									onClick={() => handleRemoveFile(0)}
									className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
								>
									<MdClose className="size-5" />
								</button>
								<div className="flex justify-between p-2">
									<p className="truncate text-sm text-gray-500">
										{fileNames[0]}
									</p>
									<p className="text-sm text-gray-500">
										{fileSizes[0] ? (fileSizes[0] / 1024).toFixed(2) : ''} KB
									</p>
								</div>
							</div>
						)}
						{type === 'video' && files.length === 1 && (
							<div className="relative overflow-hidden rounded-lg bg-gray-100">
								<video className="h-48 w-full object-cover" controls>
									<source src={files[0] ? URL.createObjectURL(files[0]) : ''} />
								</video>
								<button
									onClick={() => handleRemoveFile(0)}
									className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
								>
									<MdClose className="size-5" />
								</button>
								<div className="flex justify-between p-2">
									<p className="truncate text-sm text-gray-500">
										{fileNames[0]}
									</p>
									<p className="text-sm text-gray-500">
										{fileSizes[0] ? (fileSizes[0] / 1024).toFixed(2) : ''} KB
									</p>
								</div>
							</div>
						)}
						{type === 'file' && (
							<div className="space-y-2">
								{files.map((file, index) => (
									<div
										key={index}
										className="relative flex items-center justify-between rounded-lg bg-gray-100 p-2"
									>
										<p className="truncate text-sm text-gray-500">
											{fileNames[index]}
										</p>
										<p className="text-sm text-gray-500">
											{fileSizes[index]
												? (fileSizes[index] / 1024).toFixed(2)
												: ''}{' '}
											KB
										</p>
										<button
											onClick={() => handleRemoveFile(index)}
											className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
										>
											<MdClose className="size-5" />
										</button>
									</div>
								))}
								{files.length < 5 && (
									<div className="mt-4 text-center">
										{' '}
										<input
											type="file"
											accept={accept}
											className="hidden"
											onChange={handleFileChange}
											id={`additional-file-upload-${type}`}
											multiple
										/>{' '}
										<label
											htmlFor={`additional-file-upload-${type}`}
											className="inline-flex cursor-pointer items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											{' '}
											Subir más archivos{' '}
										</label>{' '}
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
			{errors && <p className="mt-2 text-sm text-red-500">{errors}</p>}
		</div>
	);
};

export default FileUpload;
