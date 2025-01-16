import { Suspense } from 'react';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type Course as CourseSchemaDTS, type WithContext } from 'schema-dts';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { getCourseById } from '~/server/actions/studentActions';
import CourseDetails, { type Course } from './CourseDetails';

interface Props {
  params: { id: string };
}

async function getValidCoverImageUrl(
  coverImageKey: string | null
): Promise<string> {
  const coverImageUrl = coverImageKey
    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`
    : `https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT`;

  try {
    const response = await fetch(coverImageUrl);
    if (response.status === 403) {
      return `https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT`;
    }
    return coverImageUrl;
  } catch {
    return `https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT`;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourseById(Number(params.id));

  if (!course) {
    return {
      title: 'Curso no encontrado',
      description: 'El curso solicitado no pudo ser encontrado.',
    };
  }

  const coverImageUrl = await getValidCoverImageUrl(course.coverImageKey);
  const motivationalMessage = '¡Subscríbete ya en este curso excelente!';

  return {
    title: `${course.title} | Artiefy`,
    description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
    openGraph: {
      title: `${course.title} | Artiefy`,
      description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
      images: [
        {
          url: coverImageUrl,
          width: 1200,
          height: 630,
          alt: `Portada del curso: ${course.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${course.title} | Artiefy`,
      description: `${course.description ?? 'No hay descripción disponible.'} ${motivationalMessage}`,
      images: [coverImageUrl],
    },
  };
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<CourseSkeleton />}>
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
        }
      : undefined,
    modalidad: course.modalidad
      ? {
          name: course.modalidad.name,
        }
      : undefined,
    enrollments: course.enrollments, // Keep the original enrollments array
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
    dateCreated: course.createdAt.toISOString(),
    dateModified: course.updatedAt.toISOString(),
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

function CourseSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-20 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
