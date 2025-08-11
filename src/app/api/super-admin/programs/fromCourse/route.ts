import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { materias, programas } from "~/server/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  try {
    if (courseId) {
      // Optimize query by ensuring proper indexing and reducing redundant operations
      const results = await db
        .select({
          id: programas.id,
          title: programas.title,
        })
        .from(materias)
        .innerJoin(programas, eq(materias.programaId, programas.id))
        .where(eq(materias.courseid, Number(courseId)))
        .execute();

      return NextResponse.json(results);
    } else {
      // Return all programs if no courseId is provided
      const allPrograms = await db
        .select({
          id: programas.id,
          title: programas.title,
        })
        .from(programas)
        .execute();

      return NextResponse.json(allPrograms);
    }
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Error fetching programs" },
      { status: 500 },
    );
  }
}
