import type { Metadata } from 'next';

export const globalMetadata: Metadata = {
  metadataBase: new URL('https://artiefy.vercel.app'),
  title: 'Artiefy',
  description: 'Artiefy es la plataforma de aprendizaje más innovadora para estudiantes y profesores.',
  keywords: ['cursos', 'aprendizaje', 'educación', 'profesores', 'estudiantes'],
  applicationName: 'Artiefy',
  authors: [{ name: 'Equipo Artiefy', url: 'https://artiefy.vercel.app' }],
  creator: 'Equipo Artiefy',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://artiefy.vercel.app',
    title: 'Artiefy - Aprende y Crea',
    description: 'Artiefy es la plataforma de aprendizaje más innovadora.',
    images: [
      {
        url: 'https://artiefy.vercel.app/opengraph-image', // Asegúrate de que esta URL sea válida y accesible
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
    icon: '/artiefy-icon.png',
    apple: '/artiefy-icon.png',
  },
};