import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';

	return {
		rules: [
			{
				userAgent: '*',
				allow: [
					'/',
					'/estudiantes',
					'/planes',
					'/estudiantes/cursos/*',
					'/estudiantes/programas/*',
				],
				disallow: [
					'/api/*',
					'/server/*',
					'/dashboard/*',
					'/_next/*',
					'/*.json$',
					'/sign-in/*',
					'/sign-up/*',
					'/user-profile/*',
					'/testing/*',
					'/consult/*',
					'/*?*', // Prevent crawling of URL parameters
				],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
		host: baseUrl,
	};
}
