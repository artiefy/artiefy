import { headers } from 'next/headers';

import type { Metadata } from 'next';

const BASE_URL = 'https://artiefy.com';

const sharedOpenGraph = {
	images: [
		{
			url: `${BASE_URL}/opengraph-image`,
			width: 1200,
			height: 630,
			alt: 'Unete a nosotros y transforma tus ideas en realidades con el poder del conocimiento',
		},
	],
	locale: 'es_ES',
	type: 'website',
};

// Función para obtener el pathname actual
export async function getCurrentPath() {
	const headersList = await headers();
	// Usar pathname del header o URL actual
	const pathname =
		headersList.get('x-invoke-path') ??
		headersList.get('x-original-url') ??
		headersList.get('x-pathname') ??
		'/';
	return pathname;
}

// Common metadata that can be reused
const defaultMetadata: Metadata = {
	title: {
		template: '%s | Artiefy - Tu Plataforma Educativa',
		default: 'Artiefy - Educación Online para Todos | Aprende a Tu Ritmo',
	},
	description:
		'Descubre una nueva forma de aprender con Artiefy. Cursos online de calidad en múltiples disciplinas para impulsar tu futuro.',
	keywords: [
		'artiefy',
		'educación online',
		'cursos online',
		'plataforma educativa',
		'aprendizaje digital',
		'estudiar online',
		'formación online',
		'artiefy educación',
		'artiefy cursos',
		'artiefy online',
	],
	metadataBase: new URL(BASE_URL),
	openGraph: {
		type: 'website',
		locale: 'es_ES',
		url: BASE_URL,
		siteName: 'Artiefy - Plataforma de Educación Online',
		images: [
			{
				url: `${BASE_URL}/opengraph-image`,
				width: 1200,
				height: 630,
				alt: 'Artiefy - App Web Educativa de Cursos Online',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		site: '@artiefy',
		creator: '@artiefy',
	},
	verification: {
		google: 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
};

// Route-specific metadata mejorado
export async function getMetadataForRoute(): Promise<Metadata> {
	const pathname = await getCurrentPath();

	const baseMetadata = {
		...defaultMetadata,
		openGraph: {
			...defaultMetadata.openGraph,
			...sharedOpenGraph,
		},
	};

	switch (pathname) {
		case '/':
			return {
				...baseMetadata,
				title:
					'Artiefy - Plataforma Líder en Educación Online | Impulsa tu Futuro Profesional',
				description:
					'Transforma tu futuro con Artiefy. Accede a cursos online de calidad en diferentes áreas del conocimiento.',
				keywords: [
					'artiefy',
					'artiefy plataforma',
					'cursos artiefy',
					'educación online artiefy',
					'plataforma educativa',
					'cursos online',
					'educación digital',
					'aprendizaje online',
				],
				alternates: { canonical: BASE_URL },
				openGraph: {
					...baseMetadata.openGraph,
					title: 'Artiefy - Inicio',
					url: BASE_URL,
				},
			};

		case '/estudiantes':
			return {
				...baseMetadata,
				title:
					'Cursos y Programas Educativos Online | Formación Integral en Artiefy',
				description:
					'Explora nuestra biblioteca de cursos y programas diseñados para potenciar tu desarrollo profesional.',
				keywords: [
					'artiefy cursos',
					'programas artiefy',
					'cursos online artiefy',
					'estudiantes artiefy',
					'formación profesional',
					'cursos digitales',
					'programas educativos',
				],
				alternates: { canonical: `${BASE_URL}/estudiantes` },
				openGraph: {
					...baseMetadata.openGraph,
					title: 'Artiefy - Cursos y Programas',
					url: `${BASE_URL}/estudiantes`,
				},
			};

		case '/planes':
			return {
				...baseMetadata,
				title:
					'Planes de Suscripción Educativos | Invierte en tu Futuro con Artiefy',
				description:
					'Encuentra el plan perfecto para tu formación. Acceso ilimitado a contenido educativo de calidad.',
				keywords: [
					'planes artiefy',
					'suscripción artiefy',
					'precios artiefy',
					'membresía artiefy',
					'planes educativos',
					'suscripción cursos online',
					'planes de estudio',
				],
				alternates: { canonical: `${BASE_URL}/planes` },
				openGraph: {
					...baseMetadata.openGraph,
					title: 'Artiefy - Planes de Suscripción',
					url: `${BASE_URL}/planes`,
				},
			};

		default:
			return baseMetadata;
	}
}

export { defaultMetadata };
