import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import type { Course } from "~/types";
import { getCourseById } from "~/server/actions/courses/getCourseById";
import CourseDetails from "./CourseDetails";

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
        : `${process.env.NEXT_PUBLIC_BASE_URL}/placeholder-course.jpg`,
  };
}

// Función para generar metadata dinámica
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseById(Number(id));

  if (!course) {
    return {
      title: "Curso no encontrado",
      description: "El curso solicitado no pudo ser encontrado.",
    };
  }

  const previousImages = (await parent).openGraph?.images ?? [];
  const ogImage = `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${id}/opengraph-image`;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? ''),
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

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CourseContent id={id} />
    </Suspense>
  );
}

// Componente para renderizar los detalles del curso
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
