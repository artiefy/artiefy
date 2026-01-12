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
        // Bloquea cualquier otra ruta para evitar indexación fuera de las 4 principales
        disallow: ['/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
