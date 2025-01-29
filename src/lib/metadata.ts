import type { Metadata } from 'next';

export const metadata: Metadata = {
    metadataBase: new URL('https://artiefy.com/'),
    title: 'Artiefy - Tu Plataforma de Educación Definitiva',
    description: 'Artiefy es la plataforma de aprendizaje más innovadora para estudiantes y profesores.',
    keywords: ['cursos', 'aprendizaje', 'educación', 'profesores', 'estudiantes'],
    applicationName: 'Artiefy',
    authors: [{ name: 'Equipo Artiefy', url: 'https://artiefy.com/' }],
    creator: 'Equipo Artiefy',
    category: 'Educacion',
    openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: 'https://artiefy.com/',
        title: 'Artiefy - Aprende y Crea',
        description: 'Artiefy es la plataforma de aprendizaje más innovadora.',
        siteName: 'Artiefy',
        images: [
            {
                url: 'https://artiefy.com/opengraph-image',
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
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/artiefy-icon.png',
    },
};