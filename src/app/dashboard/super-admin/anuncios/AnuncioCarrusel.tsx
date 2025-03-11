'use client';

import { useEffect, useState } from 'react';
import AnuncioPopup from '~/app/dashboard/super-admin/anuncios/AnuncioPopup';

interface Anuncio {
	titulo: string;
	descripcion: string;
	coverImageKey: string;
}

interface AnuncioCarruselProps {
	anuncios: Anuncio[];
}

export default function AnuncioCarrusel({ anuncios }: AnuncioCarruselProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showPopup, setShowPopup] = useState(true);

	// Avanza al siguiente anuncio cada 3 segundos
	useEffect(() => {
		if (anuncios.length > 1) {
			const interval = setInterval(() => {
				setCurrentIndex((prevIndex) => (prevIndex + 1) % anuncios.length);
			}, 3000);

			return () => clearInterval(interval);
		}
	}, [anuncios.length]);

	// Si no hay anuncios, no mostrar nada
	if (anuncios.length === 0) return null;

	return (
		showPopup && (
			<AnuncioPopup
				onClose={() => {
					setShowPopup(false); // ✅ Mantiene el estado local del popup
				}}
				titulo={anuncios[currentIndex].titulo}
				descripcion={anuncios[currentIndex].descripcion}
				imagenUrl={anuncios[currentIndex].coverImageKey}
				totalAnuncios={anuncios.length} // ✅ Agregado
				currentIndex={currentIndex} // ✅ Agregado
			/>
		)
	);
}
