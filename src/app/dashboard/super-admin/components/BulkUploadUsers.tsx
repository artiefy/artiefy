'use client';
import React, { useState } from 'react';
import { FiUpload, FiDownload, FiX } from 'react-icons/fi';

const BulkUploadUsers = () => {
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);

	// Manejar la selección de archivo
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files ? e.target.files[0] : null;
		setFile(selectedFile);
	};

	// Subir archivo al servidor
	const handleUpload = async () => {
		if (!file) {
			alert('Por favor selecciona un archivo primero.');
			return;
		}
		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch('/api/usersMasive', {
				method: 'POST',
				body: formData,
			});

			if (res.ok) {
				alert('Usuarios subidos exitosamente');
				setFile(null);
				setModalIsOpen(false);

				// Ahora manejamos la descarga del archivo Excel
				const blob = await res.blob(); // Recibimos el archivo Excel como blob
				const url = window.URL.createObjectURL(blob); // Creamos un objeto URL para el archivo
				const link = document.createElement('a'); // Creamos un elemento <a> para descargar
				link.href = url;
				link.download = 'usuarios_creados.xlsx'; // Nombre del archivo para la descarga
				link.click(); // Inicia la descarga
			} else {
				throw new Error('Error al subir los usuarios');
			}
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			} else {
				alert('Error desconocido');
			}
		}
	};

	// Descargar plantilla de usuarios
	const handleDownloadTemplate = async () => {
		try {
			const res = await fetch('/api/usersMasive/', {
				method: 'GET',
			});

			if (!res.ok) {
				throw new Error('Error al descargar la plantilla');
			}

			const data = await res.blob();
			const url = window.URL.createObjectURL(data);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'plantilla_usuarios.xlsx';
			link.click();
		} catch {
			alert('Error al descargar la plantilla');
		}
	};

	return (
		<div>
			{/* Botón para abrir el modal */}
			<button
				onClick={() => setModalIsOpen(true)}
				className="bg-primary flex items-center gap-2 rounded-md px-6 py-2 text-white transition hover:scale-105"
			>
				<FiUpload /> Usuarios Masivos
			</button>

			{/* Modal */}
			{modalIsOpen && (
				<div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg transition-all duration-300">
					<div className="w-96 transform rounded-lg bg-white p-6 shadow-xl transition-transform duration-300">
						{/* Header del Modal */}
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-xl font-semibold text-[#01142B]">
								Subir Usuarios Masivos
							</h2>
							<button onClick={() => setModalIsOpen(false)}>
								<FiX size={24} className="text-gray-500 hover:text-gray-800" />
							</button>
						</div>

						{/* Cuerpo del Modal */}
						<div className="mt-4">
							{/* Input para seleccionar archivo */}
							<input
								type="file"
								accept=".xlsx"
								onChange={handleFileChange}
								className="mb-4 w-full rounded-md border border-gray-300 bg-gray-100 p-3"
							/>
							{/* Botón para subir archivo */}
							<button
								onClick={handleUpload}
								className="mb-4 w-full rounded-md bg-[#00BDD8] px-6 py-2 text-[#01142B] transition hover:scale-105 hover:bg-[#00A5C0]"
							>
								<FiUpload className="mr-2" /> Subir Archivo
							</button>

							{/* Botón para descargar plantilla */}
							<button
								onClick={handleDownloadTemplate}
								className="w-full rounded-md bg-[#3AF4EF] px-6 py-2 text-[#01142B] transition hover:scale-105 hover:bg-[#00A5C0]"
							>
								<FiDownload className="mr-2" /> Descargar Plantilla
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default BulkUploadUsers;
