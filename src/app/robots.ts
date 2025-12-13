import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/estudiantes', '/planes', '/sign-in'],
        disallow: [
          '/private/',
          '/estudiantes/cursos/',
          '/estudiantes/programas/',
          '/estudiantes?category=',
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
          '/not-found',
          '/error',
          '/global-error',
          '/robots.txt',
          '/sitemap.xml',
        ],
      },
    ],
    sitemap: 'https://artiefy.com/sitemap.xml',
  };
}
