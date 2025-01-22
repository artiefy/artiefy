import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  // Revalidate the courses API
  revalidatePath("/api/courses")

  // Revalidate the courses page
  revalidatePath("/estudiantes")

  // Revalidate specific tags if you're using them
  revalidateTag("courses")

  return NextResponse.json({ revalidated: true, now: Date.now() })
}

