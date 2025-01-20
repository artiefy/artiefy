import { type NextRequest, NextResponse } from "next/server"
import { getAllCourses, getAllCategories, getFeaturedCategories } from "~/server/actions/studentActions"

const ITEMS_PER_PAGE = 9

export async function GET(request: NextRequest) {
  try {
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") ?? "1")
    const categoryId = searchParams.get("category") ? Number.parseInt(searchParams.get("category")!, 10) : undefined
    const query = searchParams.get("query") ?? undefined

    // Fetch all data in parallel
    const [allCourses, allCategories, featuredCategories] = await Promise.all([
      getAllCourses(),
      getAllCategories(),
      getFeaturedCategories(6),
    ])

    let filteredCourses = allCourses

    // Apply category filter
    if (categoryId) {
      filteredCourses = filteredCourses.filter((course) => course.categoryid === categoryId)
    }

    // Apply search filter
    if (query) {
      const lowercasedQuery = query.toLowerCase()
      filteredCourses = filteredCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(lowercasedQuery) ??
          course.description?.toLowerCase().includes(lowercasedQuery) ??
          course.category?.name.toLowerCase().includes(lowercasedQuery) ??
          false,
      )
    }

    const totalFilteredCourses = filteredCourses.length
    const totalPages = Math.ceil(totalFilteredCourses / ITEMS_PER_PAGE)

    // Apply pagination
    const paginatedCourses = filteredCourses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    return NextResponse.json({
      courses: paginatedCourses,
      categories: allCategories,
      featuredCategories,
      total: totalFilteredCourses,
      page,
      pageSize: ITEMS_PER_PAGE,
      totalPages,
    })
  } catch (error) {
    console.error("Error in courses API:", error)
    return NextResponse.json({ error: "Error al cargar los cursos" }, { status: 500 })
  }
}

