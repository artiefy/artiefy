import { Suspense } from 'react';

import { type Metadata, type ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getClassMeetingsByCourseId } from '~/server/actions/estudiantes/classMeetings/getClassMeetingsByCourseId';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { getCourseTypeCounts } from '~/server/actions/estudiantes/courses/getCourseTypeCounts';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';

import CourseDetails from './CourseDetails';

import type { Course } from '~/types';

interface PageParams {
  id: string;
}

// Función para generar metadata dinámica
export async function generateMetadata(
  { params }: { params: { id: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const robotsNoIndex: Metadata['robots'] = { index: false, follow: false };

  try {
    // Await params to ensure it's resolved
    const { id } = await Promise.resolve(params);
    const courseId = Number(id);

    if (isNaN(courseId)) {
      return {
        title: 'Curso no encontrado',
        description: 'ID de curso inválido',
        robots: robotsNoIndex,
      };
    }

    const { userId } = await auth();
    const course = await getCourseById(courseId, userId);

    if (!course) {
      return {
        title: 'Curso no encontrado',
        description: 'El curso solicitado no pudo ser encontrado.',
        robots: robotsNoIndex,
      };
    }

    // Asegurar que tengamos una URL base válida
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';
    const metadataBase = new URL(baseUrl);

    // Fetch cover image from the API endpoint
    let coverImageUrl =
      'https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';

    try {
      const coverResponse = await fetch(
        `${baseUrl}/api/estudiantes/cursos/${courseId}/cover`,
        {
          next: { revalidate: 3600 },
        }
      );

      if (coverResponse.ok) {
        const coverData = (await coverResponse.json()) as {
          coverImageUrl?: string;
        };
        if (coverData.coverImageUrl) {
          coverImageUrl = coverData.coverImageUrl;
        }
      }
    } catch (error) {
      console.warn('Error fetching cover image from API:', error);
      // Fallback to direct course cover if API fails
      if (course.coverImageKey) {
        coverImageUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`;
      }
    }

    // Solo la imagen de portada del curso, sin imágenes generales ni previas
    return {
      metadataBase,
      title: `${course.title} | Artiefy`,
      description: course.description ?? 'No hay descripción disponible.',
      robots: robotsNoIndex,
      openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: new URL(`/estudiantes/cursos/${courseId}`, baseUrl).toString(),
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
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'Error al cargar el curso',
      robots: robotsNoIndex,
    };
  }
}

// Componente principal de la página del curso
export default async function Page({ params }: { params: PageParams }) {
  // Already awaiting params here, keep this as is
  const { id } = await Promise.resolve(params);

  return (
    <div className="pt-0">
      {' '}
      {/* Antes sin pt-0 */}
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
  try {
    const courseId = Number(id);
    if (isNaN(courseId)) {
      notFound();
    }

    const { userId } = await auth();
    const course = await getCourseById(courseId, userId);

    if (!course) {
      notFound();
    }

    // Asegura que userId es string (no null)
    const safeUserId = userId ?? '';

    // Obtener lecciones sincronizadas con progreso real del usuario
    const lessons =
      (await getLessonsByCourseId(courseId, safeUserId))?.map((lesson) => ({
        ...lesson,
        isLocked: lesson.isLocked,
        porcentajecompletado: lesson.userProgress,
        isNew: lesson.isNew,
      })) ?? [];

    const courseTypeCounts = await getCourseTypeCounts();

    // Fetch class meetings for this course
    const rawClassMeetings = await getClassMeetingsByCourseId(courseId);

    // Convert Date fields to ISO strings for type compatibility
    const classMeetings = rawClassMeetings.map((meeting) => ({
      ...meeting,
      startDateTime: meeting.startDateTime
        ? new Date(meeting.startDateTime).toISOString()
        : '',
      endDateTime: meeting.endDateTime
        ? new Date(meeting.endDateTime).toISOString()
        : '',
      createdAt: meeting.createdAt
        ? new Date(meeting.createdAt).toISOString()
        : null,
    }));

    const courseForDetails: Course = {
      ...course,
      totalStudents: course.enrollments?.length ?? 0,
      lessons,
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

    return (
      <section>
        <CourseDetails
          course={courseForDetails}
          classMeetings={classMeetings}
          courseTypeCounts={courseTypeCounts}
        />
      </section>
    );
  } catch (error) {
    console.error('Error in CourseContent:', error);
    throw error;
  }
}
