import { Suspense } from 'react';

import { eq } from 'drizzle-orm';

import Footer from '~/components/estudiantes/layout/Footer';
import { db } from '~/server/db';
import { categories, courses, modalidades, nivel } from '~/server/db/schema';

import CourseDetail, { type Course } from './CourseDetail';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Consulta LIGERA solo para el encabezado del curso: curso + nombres de
// categoría/nivel/modalidad (en paralelo). No trae meetings, videos de Teams ni
// instructores (eso lo carga el cliente en segundo plano). Así el detalle se
// pinta de inmediato sin bloquear la navegación con la consulta pesada.
async function getCourseHeader(courseId: number): Promise<Course | null> {
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .then((r) => r[0]);
  if (!course) return null;

  const [cat, niv, mod] = await Promise.all([
    course.categoryid
      ? db
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, course.categoryid))
          .then((r) => r[0])
      : Promise.resolve(undefined),
    course.nivelid
      ? db
          .select({ name: nivel.name })
          .from(nivel)
          .where(eq(nivel.id, course.nivelid))
          .then((r) => r[0])
      : Promise.resolve(undefined),
    course.modalidadesid
      ? db
          .select({ name: modalidades.name })
          .from(modalidades)
          .where(eq(modalidades.id, course.modalidadesid))
          .then((r) => r[0])
      : Promise.resolve(undefined),
  ]);

  // Objeto plano (fechas → string) con arrays vacíos por seguridad; el cliente
  // reemplaza todo con los datos completos al montar.
  const header = {
    ...course,
    categoryName: cat?.name,
    nivelName: niv?.name,
    modalidadesName: mod?.name,
    courseTypes: [],
    instructors: [],
    meetings: [],
  };
  return JSON.parse(JSON.stringify(header)) as Course;
}

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: number }>;
}) {
  const resolvedParams = await params;

  const courseId = Number(resolvedParams.courseId);
  let initialCourse: Course | null = null;
  if (Number.isFinite(courseId)) {
    try {
      initialCourse = await getCourseHeader(courseId);
    } catch {
      initialCourse = null;
    }
  }

  return (
    <div className="min-h-screen bg-background pt-0">
      <Suspense fallback={<div className="min-h-[800px]" />}>
        {' '}
        {/* Skeleton opcional */}
        <section
          className="
            mx-auto max-w-[1600px] px-4 py-2
            md:px-6 md:py-8
            lg:px-8
          "
        >
          <CourseDetail
            courseId={resolvedParams.courseId}
            initialCourse={initialCourse}
          />
        </section>
      </Suspense>
      <Footer />
    </div>
  );
}
