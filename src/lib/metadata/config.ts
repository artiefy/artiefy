import { headers } from 'next/headers';

import type { Metadata } from 'next';

// sharedOpenGraph solo debe usarse en páginas generales, no en cursos dinámicos
const sharedOpenGraph = {
  images: [
    {
      url: 'https://artiefy.com/opengraph-image',
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
    default: 'Artiefy - Cursos Online | Aprende a Tu Ritmo',
  },
  description: 'Cursos online de calidad en diferentes áreas del conocimiento.',
  keywords: [
    'artiefy',
    'cursos online',
    'educación online',
    'plataforma educativa',
    'aprendizaje digital',
    'estudiar online',
    'formación online',
    'artiefy educación',
    'artiefy cursos',
    'artiefy online',
  ],
  metadataBase: new URL('https://artiefy.com'),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://artiefy.com',
    siteName: 'Artiefy - Plataforma de Educación Online',
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
        title: 'Artiefy - Cursos Online | Impulsa tu Futuro Profesional',
        description:
          'Cursos online de calidad en diferentes áreas del conocimiento.',
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
        alternates: { canonical: 'https://artiefy.com' },
        openGraph: {
          ...baseMetadata.openGraph,
          title: 'Artiefy - Cursos Online',
          url: 'https://artiefy.com',
        },
      };

    case '/estudiantes':
      return {
        ...baseMetadata,
        title: 'Cursos Online | Formación Integral en Artiefy',
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
        alternates: { canonical: 'https://artiefy.com/estudiantes' },
        openGraph: {
          ...baseMetadata.openGraph,
          title: 'Artiefy - Cursos',
          url: 'https://artiefy.com/estudiantes',
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
        alternates: { canonical: 'https://artiefy.com/planes' },
        openGraph: {
          ...baseMetadata.openGraph,
          title: 'Artiefy - Planes de Suscripción',
          url: 'https://artiefy.com/planes',
        },
      };

    default:
      return baseMetadata;
  }
}

export { defaultMetadata };
