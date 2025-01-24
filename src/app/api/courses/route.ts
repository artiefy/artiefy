import { type NextRequest, NextResponse } from "next/server"
import { getAllCategories } from "~/server/actions/categories/getAllCategories"
import { getFeaturedCategories } from "~/server/actions/categories/getFeaturedCategories"
import { getAllCourses } from "~/server/actions/courses/getAllCourses"

const ITEMS_PER_PAGE = 9

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10)
    const categoryId = searchParams.get("category") ? Number.parseInt(searchParams.get("category")!, 10) : undefined
    const query = searchParams.get("query") ?? undefined

    console.log("Received request with params:", { page, categoryId, query })

    const [allCourses, allCategories, featuredCategories] = await Promise.all([
      getAllCourses().catch((error) => {
        console.error("Error fetching all courses:", error)
        throw new Error("Failed to fetch courses")
      }),
      getAllCategories().catch((error) => {
        console.error("Error fetching all categories:", error)
        throw new Error("Failed to fetch categories")
      }),
      getFeaturedCategories(6).catch((error) => {
        console.error("Error fetching featured categories:", error)
        throw new Error("Failed to fetch featured categories")
      }),
    ])

    console.log("Fetched data:", {
      coursesCount: allCourses.length,
      categoriesCount: allCategories.length,
      featuredCategoriesCount: featuredCategories.length,
    })

    let filteredCourses = allCourses

    if (categoryId) {
      filteredCourses = filteredCourses.filter((course) => course.categoryid === categoryId)
      console.log(`Filtered courses for category ${categoryId}:`, filteredCourses.length)
    }

    if (query) {
      const lowercasedQuery = query.toLowerCase()
      filteredCourses = filteredCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(lowercasedQuery) ||
          (course.description?.toLowerCase().includes(lowercasedQuery)) ||
          course.category?.name.toLowerCase().includes(lowercasedQuery),
      )
      console.log(`Filtered courses for query "${query}":`, filteredCourses.length)
    }

    const totalFilteredCourses = filteredCourses.length
    const totalPages = Math.ceil(totalFilteredCourses / ITEMS_PER_PAGE)
    const paginatedCourses = filteredCourses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    console.log("Pagination info:", { totalFilteredCourses, totalPages, currentPage: page })

    const response = NextResponse.json({
      courses: paginatedCourses,
      categories: allCategories,
      featuredCategories,
      total: totalFilteredCourses,
      page,
      pageSize: ITEMS_PER_PAGE,
      totalPages,
      categoryId,
      searchTerm: query,
    })

    response.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate")

    return response
  } catch (error) {
    console.error("Error en la API de cursos:", error)
    return NextResponse.json(
      { error: "Error al cargar los cursos", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export const runtime = "nodejs"

