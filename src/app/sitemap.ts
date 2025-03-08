import { type MetadataRoute } from 'next';

import { getAllCourses } from '~/server/actions/estudiantes/courses/getAllCourses';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

	try {
		const courses = await getAllCourses();

		const courseUrls = courses.map((course) => ({
			url: `${baseUrl}/estudiantes/cursos/${course.id}`,
			lastModified: new Date(course.updatedAt),
			changeFrequency: 'weekly' as const,
			priority: 0.8,
		}));

		return [
			{
				url: `${baseUrl}/estudiantes/cursos`,
				lastModified: new Date(),
				changeFrequency: 'daily',
				priority: 1,
			},
			{
				url: `${baseUrl}/planes`,
				lastModified: new Date(),
				changeFrequency: 'weekly',
				priority: 0.9,
			},
			...courseUrls,
		];
	} catch (error) {
		console.error(
			'Error generating sitemap:',
			error instanceof Error ? error.message : 'Unknown error'
		);

		return [
			{
				url: baseUrl,
				lastModified: new Date(),
				changeFrequency: 'daily',
				priority: 1,
			},
		];
	}
}
