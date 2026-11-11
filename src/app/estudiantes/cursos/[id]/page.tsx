import { type ComponentProps, Suspense } from 'react';

import { type Metadata, type ResolvingMetadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import Footer from '~/components/estudiantes/layout/Footer';
import {
  hasIndexableDescription,
  indexRobots,
  noIndexRobots,
  toMetaDescription,
} from '~/lib/metadata/config';
import { getClassMeetingsByCourseId } from '~/server/actions/estudiantes/classMeetings/getClassMeetingsByCourseId';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { getCourseTypeCounts } from '~/server/actions/estudiantes/courses/getCourseTypeCounts';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';
import { getApiSession } from '~/server/utils/apiAuth';
import { getDashboardRouteByRole } from '~/utils/roles';

import CourseDetails from './CourseDetails';

import type { ClassMeeting, Course, Enrollment } from '~/types';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface PageParams {
  id: string;
}

// Función para generar metadata dinámica
export async function generateMetadata(
  { params }: { params: { id: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const robotsNoIndex = noIndexRobots;

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
    } catch {
      // Fallback to direct course cover if API fails
      if (course.coverImageKey) {
        coverImageUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`;
      }
    }

    const description =
      toMetaDescription(course.description) || 'No hay descripción disponible.';
    const isIndexable =
      course.isActive !== false && hasIndexableDescription(course.description);

    // Solo la imagen de portada del curso, sin imágenes generales ni previas
    return {
      metadataBase,
      title: course.title.trim(),
      description,
      robots: isIndexable ? indexRobots : noIndexRobots,
      openGraph: {
        type: 'website',
        locale: 'es_CO',
        url: new URL(`/estudiantes/cursos/${courseId}`, baseUrl).toString(),
        siteName: 'Artiefy',
        title: `${course.title} | Artiefy`,
        description,
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
        description,
        images: [coverImageUrl],
        creator: '@artiefy',
        site: '@artiefy',
      },
    };
  } catch {
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
      <Suspense fallback={<CourseDetailsSkeleton />}>
        <CourseContent id={id} />
      </Suspense>
      <Footer />
    </div>
  );
}

// Componente para renderizar los detalles del curso
async function CourseContent({ id }: { id: string }) {
  let courseDetailsProps: ComponentProps<typeof CourseDetails> | null = null;

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

    // Un educador solo puede ver las rutas [id] de SUS cursos (instructor,
    // creador o co-instructor). El super-admin pasa sin restricción.
    const { role } = await getApiSession();
    if (role === 'educador') {
      const ownsCourse = userId
        ? await isCourseOwnedByEducator(courseId, userId)
        : false;
      if (!ownsCourse) {
        redirect(getDashboardRouteByRole(role));
      }
    }

    // Asegura que userId es string (no null)
    const safeUserId = userId ?? '';

    // Todos los estudiantes inscritos del curso; solo se usa en el servidor.
    const allEnrollments: Enrollment[] = Array.isArray(course.enrollments)
      ? course.enrollments
      : [];
    const ownEnrollments = userId
      ? allEnrollments.filter((enrollment) => enrollment.userId === userId)
      : [];

    // SEG-03: el contenido privado (claves S3 de videos y recursos, enlaces de
    // clases en vivo y grabaciones) solo se serializa para quien tiene derecho:
    // sesion iniciada Y (inscrito en este curso O personal; el educador ya fue
    // validado como dueno arriba).
    const hasPrivateAccess =
      Boolean(userId) &&
      (ownEnrollments.length > 0 ||
        role === 'admin' ||
        role === 'super-admin' ||
        role === 'educador');

    // Obtener lecciones sincronizadas con progreso real del usuario
    const rawLessons =
      (await getLessonsByCourseId(courseId, safeUserId))?.map((lesson) => ({
        ...lesson,
        isLocked: false,
        porcentajecompletado: lesson.userProgress,
        isNew: lesson.isNew,
      })) ?? [];

    const courseTypeCounts = await getCourseTypeCounts();

    // Fetch class meetings for this course
    const rawClassMeetings = await getClassMeetingsByCourseId(courseId);

    // Convert Date fields to ISO strings for type compatibility
    const allClassMeetings: ClassMeeting[] = rawClassMeetings.map(
      (meeting) => ({
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
      })
    );

    // Counts shown on the public tabs; computed before any redaction so the
    // page keeps rendering the same numbers for visitors without access.
    const publicCounts = {
      resources: rawLessons.filter(
        (lesson) => lesson.resourceKey && lesson.resourceKey.trim() !== ''
      ).length,
      recordings: allClassMeetings.filter(
        (meeting) => !!meeting.video_key || !!meeting.videoUrlExt?.trim()
      ).length,
    };

    const lessons = hasPrivateAccess
      ? rawLessons
      : rawLessons.map((lesson) => ({
          ...lesson,
          coverImageKey: '',
          coverVideoKey: '',
          resourceKey: '',
          resourceNames: [],
        }));

    // Visitors without access only get the upcoming/live sessions (titles and
    // dates), never join links, recording keys or external recording URLs.
    const classMeetings: ClassMeeting[] = hasPrivateAccess
      ? allClassMeetings
      : allClassMeetings
          .filter(
            (meeting) => !meeting.video_key && !meeting.videoUrlExt?.trim()
          )
          .map((meeting) => ({
            id: meeting.id,
            courseId: meeting.courseId,
            title: meeting.title,
            startDateTime: meeting.startDateTime,
            endDateTime: meeting.endDateTime,
            weekNumber: meeting.weekNumber,
            createdAt: meeting.createdAt,
            meetingId: '',
            joinUrl: null,
            video_key: null,
            video_key_2: null,
            videoUrlExt: null,
            progress: null,
          }));

    const courseForDetails: Course = {
      ...course,
      totalStudents: allEnrollments.length,
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
      // Never ship other students' ids to the browser: only the viewer's own.
      enrollments: ownEnrollments,
    };

    courseDetailsProps = {
      course: courseForDetails,
      classMeetings,
      courseTypeCounts,
      isSignedInOnServer: Boolean(userId),
      publicCounts,
    };
  } catch (error) {
    throw error;
  }

  if (!courseDetailsProps) {
    notFound();
  }

  const { course } = courseDetailsProps;
  const courseSchema =
    course.isActive !== false && hasIndexableDescription(course.description)
      ? {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title.trim(),
          description: course.description?.trim(),
          url: `https://artiefy.com/estudiantes/cursos/${course.id}`,
          inLanguage: 'es-CO',
          provider: { '@id': 'https://artiefy.com/#organization' },
        }
      : null;

  return (
    <section>
      {courseSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(courseSchema).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <CourseDetails {...courseDetailsProps} />
    </section>
  );
}
