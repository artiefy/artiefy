import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';

	return {
		rules: {
			userAgent: '*',
			allow: ['/'],
			disallow: [
				'/api/',
				'/server/',
				'/dashboard/',
				'/sign-in/',
				'/sign-up/',
				'/user-profile/',
				'/_next/',
				'/*.json$',
			],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
		host: baseUrl,
	};
}
