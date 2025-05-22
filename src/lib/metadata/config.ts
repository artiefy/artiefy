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
		template: '%s | Artiefy',
		default: 'Artiefy - Plataforma Educativa Digital',
	},
	description:
		'Aprende desarrollo web, programación y más con expertos de la industria en Artiefy, la plataforma líder en educación digital.',
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
				title: 'Artiefy - Inicio',
				description:
					'Descubre una nueva forma de aprender con Artiefy. Cursos online de alta calidad.',
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
				title: 'Artiefy - Cursos y Programas',
				description:
					'Accede a tus cursos y contenido educativo en Artiefy. Aprende con los mejores instructores.',
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
				title: 'Artiefy - Planes de Suscripción',
				description:
					'Explora nuestros planes y encuentra el que mejor se adapte a tus necesidades de aprendizaje.',
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
