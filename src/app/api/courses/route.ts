import { type NextRequest, NextResponse } from "next/server"
import { getAllCourses } from "~/server/actions/courses/getAllCourses"
import { getAllCategories } from "~/server/actions/categories/getAllCategories"
import { getFeaturedCategories } from "~/server/actions/categories/getFeaturedCategories"

const ITEMS_PER_PAGE = 9

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10)
    const categoryId = searchParams.get("category") ? Number.parseInt(searchParams.get("category")!, 10) : undefined
    const query = searchParams.get("query") ?? undefined

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
          course.title.toLowerCase().includes(lowercasedQuery) ??
          course.description?.toLowerCase().includes(lowercasedQuery) ??
          course.category?.name.toLowerCase().includes(lowercasedQuery),
      )
    }

    const totalFilteredCourses = filteredCourses.length
    const totalPages = Math.ceil(totalFilteredCourses / ITEMS_PER_PAGE)
    const paginatedCourses = filteredCourses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

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
    return NextResponse.json({ error: "Error al cargar los cursos" }, { status: 500 })
  }
}

export const runtime = "edge"

