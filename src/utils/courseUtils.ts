import { getCourseById } from '~/server/actions/courses/getCourseById';
import type { Course as CourseSchemaDTS, WithContext } from 'schema-dts';
import type { Course } from '~/types';
import type { Metadata, ResolvingMetadata } from 'next';

export async function fetchCourseDetails(id: string): Promise<Course | null> {
    const course = await getCourseById(Number(id));
    return course ?? null;
}

export function generateJsonLd(course: Course): WithContext<CourseSchemaDTS> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.title,
        description: course.description ?? 'No hay descripción disponible.',
        provider: {
            '@type': 'Organization',
            name: 'Artiefy',
            sameAs: process.env.NEXT_PUBLIC_BASE_URL ?? '',
        },
        author: {
            '@type': 'Person',
            name: course.instructor,
        },
        dateCreated: new Date(course.createdAt).toISOString(),
        dateModified: new Date(course.updatedAt).toISOString(),
        aggregateRating: course.rating
            ? {
                    '@type': 'AggregateRating',
                    ratingValue: course.rating,
                    ratingCount: course.enrollments?.length ?? 0,
                    bestRating: 5,
                    worstRating: 1,
                }
            : undefined,
        image: course.coverImageKey
            ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
            : `${process.env.NEXT_PUBLIC_BASE_URL}/placeholder-course.jpg`,
    };
}

function isMetadataImages(value: unknown): value is Metadata['openGraph']['images'] {
    return Array.isArray(value) && value.every(item => typeof item === 'object' && item !== null);
}

export async function generateCourseMetadata(
    course: Course,
    params: { id: string },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const motivationalMessage = '¡Subscríbete ya en este curso excelente!';
    const parentMetadata = await parent;
    const previousImages = parentMetadata.openGraph && isMetadataImages(parentMetadata.openGraph.images)
        ? parentMetadata.openGraph.images
        : [];

    const ogImage = `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${params.id}/opengraph-image`;

    return {
        metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? ''),
        title: `${course.title} | Artiefy`,
        description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
        openGraph: {
            type: 'website',
            locale: 'es_ES',
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${params.id}`,
            siteName: 'Artiefy',
            title: `${course.title} | Artiefy`,
            description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: `Portada del curso: ${course.title}`,
                },
                ...previousImages,
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${course.title} | Artiefy`,
            description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
            images: [ogImage],
            creator: '@artiefy',
            site: '@artiefy',
        },
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${params.id}`,
        },
    };
}
