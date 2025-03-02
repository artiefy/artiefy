import { auth } from '@clerk/nextjs/server';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import type { Course } from '~/types';
import CourseDetails from './CourseDetails';

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Record<string, string | string[] | undefined>;
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
	{ params }: Props,
	parent: ResolvingMetadata
): Promise<Metadata> {
	const { id } = await params;
	const { userId } = await auth();
	const course = await getCourseById(Number(id), userId);

	if (!course) {
		return {
			title: 'Curso no encontrado',
			description: 'El curso solicitado no pudo ser encontrado.',
		};
	}

	const previousImages = (await parent).openGraph?.images ?? [];
	const ogImage = `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${id}/opengraph-image`;

	return {
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
		),
		title: `${course.title} | Artiefy`,
		description: `${course.description ?? 'No hay descripción disponible.'} ¡Subscríbete ya en este curso excelente!`,
		openGraph: {
			type: 'website',
			locale: 'es_ES',
			url: `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${id}`,
			siteName: 'Artiefy',
			title: `${course.title} | Artiefy`,
			description: `${course.description ?? 'No hay descripción disponible.'} ¡Subscríbete ya en este curso excelente!`,
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
			description: `${course.description ?? 'No hay descripción disponible.'} ¡Subscríbete ya en este curso excelente!`,
			images: [ogImage],
			creator: '@artiefy',
			site: '@artiefy',
		},
		alternates: {
			canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${id}`,
		},
	};
}

// Componente principal de la página del curso
export default async function Page({ params }: Props) {
	const { id } = await params;
	const { userId } = await auth();

	return (
		<div>
			<Header />
			<CourseContent id={id} userId={userId} />
			<Footer />
		</div>
	);
}

// Componente para renderizar los detalles del curso
async function CourseContent({
	id,
	userId,
}: {
	id: string;
	userId: string | null;
}) {
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

export const revalidate = 3600;
export const dynamic = 'force-dynamic';
