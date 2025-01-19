import { Suspense } from "react"
import { getPaginatedCourses, getAllCategories, getFeaturedCategories } from "~/server/actions/studentActions"
import StudentDashboard from "./index"
import { LoadingCourses } from "~/components/estudiantes/layout/LoadingCourses"
import CourseCategories from "~/components/estudiantes/layout/CourseCategories"
import CourseListStudent from "~/components/estudiantes/layout/CourseListStudent"

const ITEMS_PER_PAGE = 9

interface SearchParams {
  category?: string
  searchTerm?: string 
  page?: string
}

interface Props {
  searchParams: SearchParams
}

export default async function CoursesPage({ searchParams }: Props) {
  // Await and parse search params
  const params = await new Promise<SearchParams>((resolve) => {
    resolve(searchParams)
  })

  const currentPage = params.page ? Number.parseInt(params.page, 10) : 1
  const categoryId = params.category ? Number.parseInt(params.category, 10) : undefined
  const searchTerm = params.searchTerm

  try {
    // Fetch data in parallel
    const [coursesData, allCategories, featuredCategories] = await Promise.all([
      getPaginatedCourses({
        pagenum: currentPage,
        categoryId,
        searchTerm,
        limit: ITEMS_PER_PAGE,
      }),
      getAllCategories(),
      getFeaturedCategories(6),
    ])

    // Early return if no data
    if (!coursesData?.courses) {
      throw new Error('No courses data found')
    }

    return (
      <Suspense fallback={<LoadingCourses />}>
        <StudentDashboard initialCourses={coursesData.courses}>
          <CourseCategories 
            allCategories={allCategories} 
            featuredCategories={featuredCategories}
          />
          <CourseListStudent
            courses={coursesData.courses}
            currentPage={currentPage}
            totalPages={coursesData.totalPages}
            totalCourses={coursesData.total}
            category={params.category} // Use awaited params
            searchTerm={searchTerm}
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