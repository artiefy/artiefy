import { Suspense } from "react"
import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import type { Course } from "~/types"
import { fetchCourseDetails, generateJsonLd, generateCourseMetadata } from "~/utils/courseUtils"
import CourseDetails from "./CourseDetails"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Record<string, string | string[] | undefined>
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await params
  const course = await fetchCourseDetails(id)

  if (!course) {
    return {
      title: "Curso no encontrado",
      description: "El curso solicitado no pudo ser encontrado.",
    }
  }

  return generateCourseMetadata(course, { id }, parent)
}

export default async function Page({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CourseContent id={id} />
    </Suspense>
  )
}

async function CourseContent({ id }: { id: string }) {
  const course = await fetchCourseDetails(id)

  if (!course) {
    notFound()
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
  }

  const jsonLd = generateJsonLd(course)

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
  )
}

