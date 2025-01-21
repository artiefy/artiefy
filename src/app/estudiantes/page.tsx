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
  searchParams: Promise<SearchParams>
}

interface APIResponse {
  courses: Course[]
  categories: Category[]
  featuredCategories: Category[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  categoryId?: number
  searchTerm?: string
}

async function fetchCourseData(params: SearchParams): Promise<APIResponse> {
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/api/courses`)

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, String(value))
    }
  })

  console.log("Fetching from URL:", url.toString())

  const response = await fetch(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  })

  if (!response.ok) {
    console.error("API response not OK:", response.status, response.statusText)
    const text = await response.text()
    console.error("Response body:", text)
    throw new Error(`Error al cargar los cursos: ${response.status} ${response.statusText}`)
  }

  const data: APIResponse = await response.json() as APIResponse
  return {
    ...data,
    categoryId: data.categoryId,
    searchTerm: data.searchTerm,
  }
}

export default async function CoursesPage({ searchParams }: Props) {
  try {
    const params = await searchParams
    const data = await fetchCourseData(params)
    console.log("Course data fetched successfully")

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
            category={data.categoryId?.toString()}
            searchTerm={data.searchTerm}
          />
        </StudentDashboard>
      </Suspense>
    )
  } catch (error) {
    console.error("Error al cargar los cursos:", error)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Error al cargar los Cursos</h2>
          <p>Por favor, intenta de nuevo más tarde.</p>
        </div>
      </div>
    )
  }
}
