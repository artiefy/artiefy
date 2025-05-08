import { type MetadataRoute } from 'next';

import { getAllCategories } from '~/server/actions/estudiantes/categories/getAllCategories';
import { getAllCourses } from '~/server/actions/estudiantes/courses/getAllCourses';
import { getAllPrograms } from '~/server/actions/estudiantes/programs/getAllPrograms';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';

	try {
		const [courses, categories, programs] = await Promise.all([
			getAllCourses(),
			getAllCategories(),
			getAllPrograms(),
		]);

		// Main routes with high priority
		const mainRoutes = [
			{
				url: baseUrl,
				lastModified: new Date(),
				changeFrequency: 'daily' as const,
				priority: 1,
			},
			{
				url: `${baseUrl}/estudiantes`,
				lastModified: new Date(),
				changeFrequency: 'daily' as const,
				priority: 0.9,
			},
			{
				url: `${baseUrl}/planes`,
				lastModified: new Date(),
				changeFrequency: 'weekly' as const,
				priority: 0.9,
			},
		];

		// Course URLs
		const courseUrls = courses.map((course) => ({
			url: `${baseUrl}/estudiantes/cursos/${course.id}`,
			lastModified: new Date(course.updatedAt),
			changeFrequency: 'weekly' as const,
			priority: 0.8,
		}));

		// Program URLs
		const programUrls = programs.map((program) => ({
			url: `${baseUrl}/estudiantes/programas/${program.id}`,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 0.8,
		}));

		// Category URLs
		const categoryUrls = categories.map((category) => ({
			url: `${baseUrl}/estudiantes?category=${category.id}`,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 0.7,
		}));

		return [...mainRoutes, ...courseUrls, ...programUrls, ...categoryUrls];
	} catch (error) {
		console.error('Error generating sitemap:', error);
		// Fallback with main routes only
		return [
			{
				url: baseUrl,
				lastModified: new Date(),
				changeFrequency: 'daily' as const,
				priority: 1,
			},
		];
	}
}