import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { courses, enrollments } from "~/server/db/schema";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }
  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
    })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, userId))
    .execute();

  // quitar duplicados
  const unique = Array.from(new Map(rows.map((r) => [r.id, r])).values());
  return NextResponse.json({ courses: unique });
}
