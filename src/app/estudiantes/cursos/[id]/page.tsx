import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { type Metadata, type ResolvingMetadata } from 'next';

import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';

import CourseDetails from './CourseDetails';

import type { Course } from '~/types';

interface PageParams {
	id: string;
}

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
			: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT',
	};
}

// Función para generar metadata dinámica
export async function generateMetadata(
	{ params }: { params: { id: string } },
	parent: ResolvingMetadata
): Promise<Metadata> {
	const { id } = await Promise.resolve(params);
	const { userId } = await auth();
	const course = await getCourseById(Number(id), userId);

	if (!course) {
		return {
			title: 'Curso no encontrado',
			description: 'El curso solicitado no pudo ser encontrado.',
		};
	}

	// Asegurar que tengamos una URL base válida
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';
	const metadataBase = new URL(baseUrl);

	// Construir URL absoluta para la imagen
	const coverImageUrl = new URL(
		course.coverImageKey
			? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
			: 'https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
	).toString();

	// Obtener imágenes del padre
	const previousImages = (await parent).openGraph?.images ?? [];

	return {
		metadataBase,
		title: `${course.title} | Artiefy`,
		description: course.description ?? 'No hay descripción disponible.',
		openGraph: {
			type: 'website',
			locale: 'es_ES',
			url: new URL(`/estudiantes/cursos/${id}`, baseUrl).toString(),
			siteName: 'Artiefy',
			title: `${course.title} | Artiefy`,
			description: course.description ?? 'No hay descripción disponible.',
			images: [
				{
					url: coverImageUrl,
					width: 1200,
					height: 630,
					alt: `Portada del curso: ${course.title}`,
					type: course.coverImageKey?.endsWith('.png')
						? 'image/png'
						: 'image/jpeg',
				},
				...previousImages,
			],
		},
		twitter: {
			card: 'summary_large_image',
			title: `${course.title} | Artiefy`,
			description: course.description ?? 'No hay descripción disponible.',
			images: [coverImageUrl],
			creator: '@artiefy',
			site: '@artiefy',
		},
	};
}

// Componente principal de la página del curso
export default async function Page({ params }: { params: PageParams }) {
	// Await params
	const { id } = await Promise.resolve(params);

	return (
		<div>
			<Header />
			<Suspense fallback={<CourseDetailsSkeleton />}>
				<CourseContent id={id} />
			</Suspense>
			<Footer />
		</div>
	);
}

// Componente para renderizar los detalles del curso
async function CourseContent({ id }: { id: string }) {
	const { userId } = await auth();
	const course = await getCourseById(Number(id), userId);

	if (!course) {
		notFound();
	}

	const courseForDetails: Course = {
		...course,
		totalStudents: course.enrollments?.length ?? 0,
		lessons:
			course.lessons?.sort((a, b) => a.title.localeCompare(b.title)) ?? [], // Ordenar por título
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
