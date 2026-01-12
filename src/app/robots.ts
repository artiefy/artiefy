import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/sign-in',
          '/planes',
          '/estudiantes',
          '/_next/',
          '/favicon.ico',
          '/robots.txt',
          '/sitemap.xml',
        ],
        // Bloqueos específicos para rutas que no queremos indexar
        disallow: [
          '/private/',
          '/dashboard/',
          '/user-profile/',
          '/sign-up/',
          '/api/',
          '/admin/',
          '/gracias/',
          '/agradecimiento-curso/',
          '/agradecimiento-plan/',
          '/consult/',
          '/proyectos/',
          '/comunidad/',
          '/clase-en-vivo/',
          '/clases-grabadas/',
          '/foro/',
          '/certificados/',
          '/myaccount/',
          '/programas/',
          '/cursos/',
          '/estudiantes/cursos/',
          '/estudiantes/programas/',
          '/estudiantes?category',
          '/not-found',
          '/error',
          '/global-error',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
