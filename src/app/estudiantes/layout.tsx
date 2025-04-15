import { type Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Portal de Estudiantes | Artiefy',
	description:
		'Accede a tus cursos, clases y recursos educativos en Artiefy. Aprende desarrollo web, programación y más con expertos de la industria.',
	openGraph: {
		title: 'Portal de Estudiantes | Artiefy',
		description:
			'Accede a tus cursos, clases y recursos educativos en Artiefy. La mejor plataforma de educación digital.',
		url: 'https://artiefy.com/estudiantes',
		siteName: 'Artiefy',
		type: 'website',
	},
	// Add priority tags for SEO
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
};

export default function EstudiantesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
