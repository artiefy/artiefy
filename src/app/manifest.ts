import type { MetadataRoute } from 'next';

// Web App Manifest for installability (Android/Chrome + iOS add-to-home-screen).
// Served at /manifest.webmanifest. Icons live in /public.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Artiefy - Plataforma de Educación Online',
    short_name: 'Artiefy',
    description:
      'Aprende con cursos online, clases en vivo y proyectos en Artiefy.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#01142B',
    theme_color: '#01142B',
    lang: 'es',
    dir: 'ltr',
    categories: ['education'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
