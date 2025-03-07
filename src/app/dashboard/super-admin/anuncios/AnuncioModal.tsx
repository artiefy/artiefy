
'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import AnuncioPreview from './AnuncioPreview';

interface AnuncioModalProps {
	onClose: () => void;
	titulo: string;
	descripcion: string;
	imagenUrl: string;
}

const AnuncioModal: React.FC<AnuncioModalProps> = ({
	onClose,
	titulo,
	descripcion,
	imagenUrl,
}) => {
	const [tituloState, setTituloState] = useState(titulo);
	const [descripcionState, setDescripcionState] = useState(descripcion);
	const [imagen, setImagen] = useState<File | null>(null);
	const [previewImagen, setPreviewImagen] = useState<string | null>(null);

	// 🔹 Manejar subida de imagen
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.length) {
			const file = event.target.files[0];
			setImagen(file);
			setPreviewImagen(URL.createObjectURL(file)); // Crear vista previa
		}
	};

	// 🔹 Guardar anuncio (simulación)
	const handleSave = async () => {
		if (!tituloState.trim() || !descripcionState.trim() || !imagen) {
			alert('Todos los campos son obligatorios');
			return;
		}

		try {
			console.log('📤 Obteniendo URL firmada de S3...');

			// 🔹 Obtener la URL firmada para subir la imagen a S3
			const uploadRequest = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contentType: imagen.type,
					fileSize: imagen.size,
				}),
			});

			if (!uploadRequest.ok) throw new Error('Error al obtener la URL firmada');

			const { url, fields, key } = (await uploadRequest.json()) as {
				url: string;
				fields: Record<string, string>;
				key: string;
			};
			console.log('✅ URL firmada recibida:', { url, fields, key });

			// 🔹 Subir la imagen directamente a S3
			const formData = new FormData();
			Object.entries(fields).forEach(([key, value]) => {
				formData.append(key, value);
			});
			formData.append('file', imagen);

			const s3UploadResponse = await fetch(url, {
				method: 'POST',
				body: formData,
			});

			if (!s3UploadResponse.ok)
				throw new Error('Error al subir la imagen a S3');

			const imageUrl = `https://artiefy-upload.s3.us-east-2.amazonaws.com/${key}`;


			// 🔹 Guardar el anuncio en la base de datos
			const response = await fetch('/api/super-admin/anuncios', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					titulo: tituloState,
					descripcion: descripcionState,
					imagenUrl: imageUrl,
				}),
			});

			const responseData = (await response.json()) as { message?: string };
			console.log('📌 Respuesta del servidor:', responseData);

			if (!response.ok)
				throw new Error(responseData.message ?? 'Error al guardar el anuncio');

			alert('Anuncio guardado correctamente.');

			// 🔹 Resetear formulario
			setTituloState('');
			setDescripcionState('');
			setImagen(null);
			setPreviewImagen(null);
			onClose();
		} catch (error) {
			console.error('❌ Error al guardar anuncio:', error);
			alert('Error al guardar el anuncio.');
		}
	};

	return (
		<div className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
			<div className="relative max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
				{/* Botón de Cerrar */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-white hover:text-red-500"
				>
					<X size={24} />
				</button>

				<h2 className="mb-6 text-center text-3xl font-bold">Crear Anuncio</h2>

				{/* Campos */}
				<input
					type="text"
					placeholder="Título del anuncio"
					value={tituloState}
					onChange={(e) => setTituloState(e.target.value)}
					className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500"
				/>

				<textarea
					placeholder="Descripción"
					value={descripcionState}
					onChange={(e) => setDescripcionState(e.target.value)}
					className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500"
				/>

				{/* Adjuntar Imagen */}
				<input
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					className="mb-4 w-full cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
				/>

				{/* Vista Previa */}
				<AnuncioPreview
					titulo={tituloState}
					descripcion={descripcionState}
					imagenUrl={previewImagen ?? ''}
				/>

				{/* Botón de Guardar */}
				<button
					onClick={handleSave}
					className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
				>
					Guardar Anuncio
				</button>
			</div>
		</div>
	);
};

export default AnuncioModal;

