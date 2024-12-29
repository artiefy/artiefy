import { type MetadataRoute } from 'next';
import { getAllCourses } from '~/models/courseModels';

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const courses = await getAllCourses();
  
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/estudiantes`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  ];

  const courseUrls = courses.map((course) => ({
    url: `${baseUrl}/curso/${course.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...baseUrls, ...courseUrls];
}