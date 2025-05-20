import type { Metadata } from 'next';

const BASE_URL = 'https://artiefy.com';

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

// Route-specific metadata
export const getRouteMetadata = (path: string): Metadata => {
	switch (path) {
		case '/':
			return {
				...defaultMetadata,
				title: 'Artiefy - Inicio',
				description:
					'Descubre una nueva forma de aprender con Artiefy. Cursos online de alta calidad.',
				alternates: {
					canonical: BASE_URL,
				},
			};

		case '/estudiantes':
			return {
				...defaultMetadata,
				title: 'Artiefy - Cursos y Programas',
				description:
					'Accede a tus cursos y contenido educativo en Artiefy. Aprende con los mejores instructores.',
				alternates: {
					canonical: `${BASE_URL}/estudiantes`,
				},
			};

		case '/planes':
			return {
				...defaultMetadata,
				title: 'Artiefy - Planes de Suscripción',
				description:
					'Explora nuestros planes y encuentra el que mejor se adapte a tus necesidades de aprendizaje.',
				alternates: {
					canonical: `${BASE_URL}/planes`,
				},
			};

		default:
			return defaultMetadata;
	}
};

export { defaultMetadata };
