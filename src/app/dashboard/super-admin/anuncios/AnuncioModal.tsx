'use client';
import React, { useState, useEffect } from 'react';

import { X } from 'lucide-react';

import AnuncioPreview from './AnuncioPreview';

interface AnuncioModalProps {
	onClose: () => void;
	titulo: string;
	descripcion: string;
	imagenUrl: string;
	tipo_destinatario?: string; // Nuevo campo opcional
}

const AnuncioModal: React.FC<AnuncioModalProps> = ({
	onClose,
	titulo,
	descripcion,
}) => {
	const [tituloState, setTituloState] = useState(titulo);
	const [descripcionState, setDescripcionState] = useState(descripcion);

	const [imagen, setImagen] = useState<File | null>(null);
	const [previewImagen, setPreviewImagen] = useState<string | null>(null);
	// 🔹 Estado para checkboxes y cursos seleccionados
	const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState<string[]>(
		[]
	);
	const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(
		null
	);
	const [cursosDisponibles, setCursosDisponibles] = useState<
		{ id: number; title: string }[]
	>([]);

	// 🔹 Cargar cursos disponibles desde la API al montar el componente
	useEffect(() => {
		const fetchCursos = async () => {
			try {
				const response = await fetch('/api/cursos'); // Ajusta la ruta según tu API
				if (!response.ok) throw new Error('Error al obtener los cursos');
				const data = (await response.json()) as { id: number; title: string }[];
				setCursosDisponibles(data);
			} catch (error) {
				console.error('❌ Error al cargar cursos:', error);
			}
		};
		void fetchCursos();
	}, []);

	const handleCheckboxChange = (opcion: string) => {
		setOpcionesSeleccionadas((prev) =>
			prev.includes(opcion)
				? prev.filter((item) => item !== opcion)
				: [...prev, opcion]
		);
	};

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

			const imageUrl = `/${key}`;

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
					placeholder="Título del anuno"
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
				{/* 🔹 Opciones de checkboxes */}
				<div className="mb-4 flex flex-col space-y-2">
					<label className="flex items-center space-x-2 text-white">
						<input
							type="checkbox"
							checked={opcionesSeleccionadas.includes('curso')}
							onChange={() => handleCheckboxChange('curso')}
							className="form-checkbox h-5 w-5 text-blue-500"
						/>
						<span>Asignar a un Curso</span>
					</label>
				</div>

				{/* 🔹 Mostrar select de cursos si se activa el checkbox */}
				{opcionesSeleccionadas.includes('curso') && (
					<select
						className="mb-4 w-full rounded-lg border bg-gray-800 p-3 text-white"
						value={cursoSeleccionado ?? ''}
						onChange={(e) => setCursoSeleccionado(Number(e.target.value))}
					>
						<option value="">Selecciona un curso</option>
						{cursosDisponibles.map((curso) => (
							<option key={curso.id} value={curso.id}>
								{curso.title}
							</option>
						))}
					</select>
				)}

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
