import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getCourseById } from "~/models/courseModels";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: "ID de curso inválido" },
        { status: 400 },
      );
    }

    const course = await getCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    return NextResponse.json(
      { error: "Error al obtener el curso" },
      { status: 500 },
    );
  }
}
