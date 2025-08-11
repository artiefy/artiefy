import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { courses } from "~/server/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, parseInt(params.id)),
      with: {
        courseType: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.courseTypeId !== 4) {
      return NextResponse.json(
        { error: "Course is not available for individual purchase" },
        { status: 400 },
      );
    }

    // Ensure individualPrice is not undefined
    const safeResponse = {
      ...course,
      individualPrice: course.individualPrice ?? null,
    };

    return NextResponse.json(safeResponse);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
