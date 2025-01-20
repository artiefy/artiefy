import { Suspense } from "react"
import StudentDashboard from "./index"
import { LoadingCourses } from "~/components/estudiantes/layout/LoadingCourses"
import CourseCategories from "~/components/estudiantes/layout/CourseCategories"
import CourseListStudent from "~/components/estudiantes/layout/CourseListStudent"
import SearchForm from "~/components/estudiantes/layout/SearchForm"
import type { Category, Course } from "~/types"

interface SearchParams {
  category?: string
  query?: string
  page?: string
}

interface Props {
  searchParams: SearchParams
}

interface APIResponse {
  courses: Course[]
  categories: Category[]
  featuredCategories: Category[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchCourseData(params: SearchParams): Promise<APIResponse> {
  const searchParams = new URLSearchParams(params as Record<string, string>)
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/courses?${searchParams.toString()}`

  const res = await fetch(url, { next: { revalidate: 3600 } }) // Revalidate every hour

  if (!res.ok) {
    throw new Error("Failed to fetch course data")
  }

  return res.json() as Promise<APIResponse>
}

export default async function CoursesPage({ searchParams }: Props) {
  try {
    const data = await fetchCourseData(searchParams)
    const categoryId = searchParams.category ? Number.parseInt(searchParams.category, 10) : undefined

    return (
      <Suspense fallback={<LoadingCourses />}>
        <StudentDashboard initialCourses={data.courses}>
          <div className="container mx-auto mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="w-1/3">{/* Placeholder for dropdown if needed */}</div>
              <SearchForm />
            </div>
            <CourseCategories allCategories={data.categories} featuredCategories={data.featuredCategories} />
          </div>
          <CourseListStudent
            courses={data.courses}
            currentPage={data.page}
            totalPages={data.totalPages}
            totalCourses={data.total}
            category={categoryId?.toString()}
            searchTerm={searchParams.query}
          />
        </StudentDashboard>
      </Suspense>
    )
  } catch (error) {
    console.error("Error al cargar los cursos:", error)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Error al cargar los cursos</h2>
          <p>Por favor, intenta de nuevo más tarde.</p>
        </div>
      </div>
    )
  }
}

