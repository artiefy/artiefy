import { Suspense } from 'react';

import type { Metadata, ResolvingMetadata } from 'next';

import { notFound } from 'next/navigation';
import type { Course as CourseSchemaDTS, WithContext } from 'schema-dts';

import { getCourseById } from '~/server/actions/courses/getCourseById';
import type { Course } from '~/types';

import CourseDetails from './CourseDetails';

interface Props {
	params: { id: string };
	searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
	{ params }: Props,
	parent: ResolvingMetadata
): Promise<Metadata> {
	const course = await getCourseById(Number(params.id));

	if (!course) {
		return {
			title: 'Curso no encontrado',
			description: 'El curso solicitado no pudo ser encontrado.',
		};
	}

	const motivationalMessage = '¡Subscríbete ya en este curso excelente!';

	const previousImages = (await parent).openGraph?.images ?? [];

	return {
		title: `${course.title} | Artiefy`,
		description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
		openGraph: {
			title: `${course.title} | Artiefy`,
			description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
			images: [
				{
					url: `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${params.id}/opengraph-image`,
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
			images: [
				`${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${params.id}/opengraph-image`,
			],
		},
	};
}

export default function Page({ params }: Props) {
	return (
		<Suspense fallback={<div>Cargando...</div>}>
			<CourseContent id={params.id} />
		</Suspense>
	);
}

async function CourseContent({ id }: { id: string }) {
	const course = await getCourseById(Number(id));

	if (!course) {
		notFound();
	}

	const courseForDetails: Course = {
		...course,
		totalStudents: course.enrollments?.length ?? 0,
		lessons: course.lessons ?? [],
		category: course.category
			? {
					id: course.category.id,
					name: course.category.name,
					description: course.category.description,
					is_featured: course.category.is_featured,
				}
			: undefined,
		modalidad: course.modalidad
			? {
					name: course.modalidad.name,
				}
			: undefined,
		enrollments: course.enrollments,
	};

	const jsonLd: WithContext<CourseSchemaDTS> = {
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
				}
			: undefined,
		image: course.coverImageKey
			? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
			: `https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT`,
	};

	return (
		<section>
			<CourseDetails course={courseForDetails} />
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd),
				}}
			/>
		</section>
	);
}
