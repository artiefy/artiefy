import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/loading/',
					'/_next/',
					'/api/',
					'/dashboard/',
					'/sign-in/',
					'/sign-up/',
					'/*.json$',
					'*?loading=*',
					'*loading*',
				],
			},
		],
		sitemap: 'https://artiefy.com/sitemap.xml',
		host: 'https://artiefy.com',
	};
}
