'use client';

import Image from 'next/image';

interface AnuncioPreviewProps {
	titulo: string;
	descripcion: string;
	imagenUrl: string;
	tipo_destinatario?: string; // Nuevo campo opcional
}

export default function AnuncioPreview({
	titulo,
	descripcion,
	imagenUrl,
}: AnuncioPreviewProps) {
	return (
		<div className="relative mt-6 rounded-lg border border-[#3AF4EF] bg-[#01142B] p-6 text-center text-white shadow-lg">
			{/* 🎯 Promoción de Inscripción al Curso */}
			<div className="bg-primary absolute top-2 left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm font-bold text-black uppercase shadow-md">
				📢 ¡Inscríbete ahora y transforma tu futuro! 🚀
			</div>

			{/* 📸 Imagen del Anuncio */}
			{imagenUrl ? (
				<Image
					src={imagenUrl}
					alt="Vista previa del anuncio"
					width={500}
					height={208}
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
