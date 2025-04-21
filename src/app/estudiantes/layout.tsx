import { type Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Portal de Cursos | Artiefy',
	description:
		'Accede a tus cursos, clases y recursos educativos en Artiefy. Aprende desarrollo web, programación y más con expertos de la industria.',
	openGraph: {
		title: 'Portal de Cursos | Artiefy',
		description:
			'Accede a tus cursos, clases y recursos educativos en Artiefy. La mejor plataforma de educación digital.',
		url: 'https://artiefy.com/estudiantes',
		siteName: 'Artiefy',
		type: 'website',
		locale: 'es_ES',
		// Aquí usamos la ruta a la imagen OG generada dinámicamente
		images: [
			{
				url: 'https://artiefy.com/estudiantes/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'Artiefy - Cursos',
			},
		],
	},
	alternates: {
		canonical: 'https://artiefy.com/estudiantes',
	},
	robots: {
		index: true,
		follow: true,
		nocache: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	other: {
		'google-site-verification': 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
		'application-name': 'Artiefy',
	},
};

export default function EstudiantesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
