import { type NextRequest, NextResponse } from "next/server";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  updateCourse,
} from "~/models/courseModels";
import { getUserById } from "~/models/userModels";
import { type Course } from "~/types";

// GET: Fetch all courses
export async function GET() {
  try {
    const result = await getAllCourses();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

// POST: Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Course;
    const {
      title,
      description,
      creatorId,
      coverImageKey,
      category,
      instructor,
      rating,
    } = body;
    await createCourse({
      title,
      description: description ?? "",
      creatorId,
      coverImageKey: coverImageKey ?? "",
      category,
      instructor,
      rating: rating ?? 0,
    });
    return NextResponse.json({ message: "Course created successfully" });
  } catch (error) {
    console.error("Failed to create course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}

// PUT: Update a course by ID
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Course & { id: number };
    const {
      id,
      title,
      description,
      coverImageKey,
      category,
      instructor,
      rating,
    } = body;
    await updateCourse(id, {
      title,
      description: description ?? "",
      coverImageKey: coverImageKey ?? "",
      category,
      instructor,
      rating: rating ?? 0,
    });
    return NextResponse.json({ message: "Course updated successfully" });
  } catch (error) {
    console.error("Failed to update course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a course by ID
export async function DELETE(request: NextRequest) {
  try {
    const { id, userId } = (await request.json()) as {
      id: number;
      userId: string;
    };
    const user = await getUserById(userId);
    if (!user || user.role !== "profesor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await deleteCourse(id);
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
