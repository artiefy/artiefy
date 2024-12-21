import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db/index";
import { courses, lessons } from "~/server/db/schema";

// GET: Fetch all courses
export async function GET() {
  try {
    const result = await db.select().from(courses);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST: Create a new course
export async function POST(request: NextRequest) {
  try {
    const {
      title,
      description,
      creatorId,
      coverImageKey,
      category,
      instructor,
      rating,
    } = await request.json();
    await db.insert(courses).values({
      title,
      description,
      creatorId,
      coverImageKey,
      category,
      instructor,
      rating,
    });
    return NextResponse.json({ message: "Course created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}

// PUT: Update a course by ID
export async function PUT(request: NextRequest) {
  try {
    const {
      id,
      title,
      description,
      coverImageKey,
      category,
      instructor,
      rating,
    } = await request.json();
    await db
      .update(courses)
      .set({
        title,
        description,
        coverImageKey,
        category,
        instructor,
        rating,
      })
      .where(eq(courses.id, id));
    return NextResponse.json({ message: "Course updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE: Delete a course by ID
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await db.delete(lessons).where(eq(lessons.courseId, id)); // Delete associated lessons first
    await db.delete(courses).where(eq(courses.id, id));
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
