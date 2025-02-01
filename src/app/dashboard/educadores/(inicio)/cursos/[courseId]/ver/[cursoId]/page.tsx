'use client';
import { Suspense } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { getCourseById } from '~/server/actions/courses/getCourseById';
import type { Course } from '~/types';
import CourseDetails from './CourseDetails';

// Función para generar el JSON-LD para SEO
function generateJsonLd(course: Course): object {
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

// Componente principal de la página del curso
export default function Page() {
	const searchParams = useSearchParams();
	const courseId = searchParams?.get('courseId');

	if (!courseId) {
		return notFound();
	}

	return (
		<Suspense fallback={<div>Cargando...</div>}>
			<CourseContent courseId={courseId} />
		</Suspense>
	);
}

// Componente para renderizar los detalles del curso
async function CourseContent({ courseId }: { courseId: string }) {
	const course = await getCourseById(Number(courseId));

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

	const jsonLd = generateJsonLd(course);

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
