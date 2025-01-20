import { Suspense } from "react"
import { getAllCategories, getFeaturedCategories, getAllCourses } from "~/server/actions/studentActions"
import StudentDashboard from "./index"
import { LoadingCourses } from "~/components/estudiantes/layout/LoadingCourses"
import CourseCategories from "~/components/estudiantes/layout/CourseCategories"
import CourseListStudent from "~/components/estudiantes/layout/CourseListStudent"
import SearchForm from "~/components/estudiantes/layout/SearchForm"

const ITEMS_PER_PAGE = 9

interface SearchParams {
  category?: string
  query?: string
  page?: string
}

interface Props {
  searchParams: SearchParams
}

export default async function CoursesPage({ searchParams }: Props) {
  const currentPage = searchParams.page ? Number.parseInt(searchParams.page, 10) : 1
  const categoryId = searchParams.category ? Number.parseInt(searchParams.category, 10) : undefined
  const query = searchParams.query

  try {
    const [allCourses, allCategories, featuredCategories] = await Promise.all([
      getAllCourses(),
      getAllCategories(),
      getFeaturedCategories(6),
    ])

    let filteredCourses = allCourses

    if (categoryId) {
      filteredCourses = filteredCourses.filter((course) => course.categoryid === categoryId)
    }

    if (query) {
      const lowercasedQuery = query.toLowerCase()
      filteredCourses = filteredCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(lowercasedQuery) ||
          course.description?.toLowerCase().includes(lowercasedQuery) ?? 
          course.category?.name.toLowerCase().includes(lowercasedQuery) ?? 
          false,
      )
    }

    const totalFilteredCourses = filteredCourses.length
    const totalPages = Math.ceil(totalFilteredCourses / ITEMS_PER_PAGE)

    // Apply pagination to filtered courses
    const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const coursesData = {
      courses: paginatedCourses,
      total: totalFilteredCourses,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      totalPages: totalPages,
    }

    return (
      <Suspense fallback={<LoadingCourses />}>
        <StudentDashboard initialCourses={coursesData.courses}>
          <div className="container mx-auto mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="w-1/3">{/* Placeholder for dropdown if needed */}</div>
              <SearchForm />
            </div>
            <CourseCategories allCategories={allCategories} featuredCategories={featuredCategories} />
          </div>
          <CourseListStudent
            courses={coursesData.courses}
            currentPage={coursesData.page}
            totalPages={coursesData.totalPages}
            totalCourses={coursesData.total}
            category={categoryId?.toString()}
            searchTerm={query}
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