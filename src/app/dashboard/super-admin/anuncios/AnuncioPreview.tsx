
'use client';
import React from 'react';

interface AnuncioPreviewProps {
	titulo: string;
	descripcion: string;
	imagenUrl: string;
}

export default function AnuncioPreview({
	titulo,
	descripcion,
	imagenUrl,
}: AnuncioPreviewProps) {
	return (
		<div className="relative mt-6 rounded-lg border border-[#3AF4EF] bg-[#01142B] p-6 text-center text-white shadow-lg">
			{/* 🔥 Nueva Etiqueta de Oferta Exclusiva */}
			<div className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white uppercase shadow-md">
				🚀 Oferta Exclusiva
			</div>

			{/* 📸 Imagen del Anuncio */}
			{imagenUrl ? (
				<img
					src={imagenUrl}
					alt="Vista previa del anuncio"
					className="mb-4 h-52 w-full rounded-md border-2 border-[#3AF4EF] object-cover shadow-md"
				/>
			) : (
				<div className="flex h-52 w-full items-center justify-center rounded-md border-2 border-[#3AF4EF] bg-[#0B1D37] text-lg font-semibold text-[#3AF4EF]">
					📸 Imagen del Anuncio
				</div>
			)}

			{/* 📝 Contenido del anuncio */}
			<h3 className="text-2xl font-bold text-[#3AF4EF]">
				{titulo || 'Título del Anuncio'}
			</h3>
			<p className="mt-2 text-gray-300">
				{descripcion || 'Descripción del anuncio...'}
			</p>

			{/* 🔘 Botón con efecto profesional */}
			<button className="mt-4 rounded-md bg-[#00BDD8] px-6 py-2 font-semibold text-white shadow-md transition hover:bg-[#0099B1] hover:shadow-lg">
				¡Ver Más!
			</button>
		</div>
	);
}
