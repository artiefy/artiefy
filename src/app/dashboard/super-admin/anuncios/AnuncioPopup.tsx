import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { useRouter } from 'next/navigation';

interface AnuncioPopupProps {
	onClose: () => void;
	titulo: string;
	descripcion: string;
	imagenUrl: string;
	tipo_destinatario?: string;
	cursoId?: number;
	totalAnuncios?: number; // ✅ Nuevo: Total de anuncios en el carrusel
	currentIndex?: number; // ✅ Nuevo: Índice actual del anuncio
}

const AnuncioPopup: React.FC<AnuncioPopupProps> = ({
	onClose,
	titulo,
	descripcion,
	imagenUrl,
	tipo_destinatario,
	totalAnuncios = 1, // ✅ Valor por defecto
	currentIndex = 0, // ✅ Valor por defecto
}) => {
	const router = useRouter();
	const [loadingButton, setLoadingButton] = useState<string | null>(null);

	const handleNavigation = (path: string, buttonType: string) => {
		setLoadingButton(buttonType);
		setTimeout(() => {
			router.push(path);
		}, 1000);
	};

	return (
		<div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
			<div className="relative w-full max-w-lg rounded-lg border border-[#3AF4EF] bg-[#01142B] p-6 text-center text-white shadow-lg">
				{/* ❌ Botón de cierre */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-50 rounded-full bg-red-600 p-2 text-white transition-all hover:scale-110 hover:bg-red-700"
				>
					<X size={24} />
				</button>

				{/* 🔢 Contador de anuncios (si hay más de uno) */}
				{totalAnuncios > 1 && (
					<div className="bg-opacity-70 absolute top-3 left-3 rounded-md bg-black px-3 py-1 text-sm text-white">
						{currentIndex + 1} / {totalAnuncios}
					</div>
				)}

				<div className="bg-primary absolute top-2 left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm font-bold text-black uppercase shadow-md">
					📢 ¡Inscríbete ahora y transforma tu futuro! 🚀
				</div>
				{/* 📸 Imagen del Anuncio */}
				{imagenUrl ? (
					<Image
						src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${imagenUrl}`}
						alt="Vista previa del anuncio"
						width={500}
						height={208}
						className="mb-4 h-52 w-full rounded-md border-2 border-[#3AF4EF] object-cover shadow-md"
					/>
				) : (
					<div className="flex h-52 w-full items-center justify-center rounded-md border-2 border-[#3AF4EF] bg-[#0B1D37] text-lg font-semibold text-[#3AF4EF]">
						Imagen del Anuncio
					</div>
				)}

				{/* 📝 Contenido del anuncio */}
				<h3 className="text-2xl font-bold text-[#3AF4EF]">
					{titulo || 'Título del Anuncio'}
				</h3>
				<p className="mt-2 text-gray-300">
					{descripcion || 'Descripción del anuncio...'}
				</p>
				{tipo_destinatario && (
					<p className="mt-2 text-sm text-gray-400">
						<strong>Destinatario:</strong> {tipo_destinatario}
					</p>
				)}

				{/* Botones con efectos animados */}
				<div className="mt-4 flex justify-center gap-4">
					{/* Botón de Ver Planes */}
					<button
						onClick={() => handleNavigation('/planes', 'planes')}
						className="relative flex items-center justify-center gap-2 rounded-md bg-blue-500 px-6 py-2 text-white transition-all hover:scale-105 hover:bg-blue-600 disabled:opacity-70"
						disabled={loadingButton !== null}
					>
						{loadingButton === 'planes' ? (
							<Loader2 className="size-5 animate-spin" />
						) : (
							<>Ver Planes</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AnuncioPopup;
