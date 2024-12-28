import { type NextRequest, NextResponse } from "next/server";
import { getCourseById } from "~/models/courseModels";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const course = await getCourseById(Number(params.id));
    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    return NextResponse.json({ error: "Error al obtener el curso" }, { status: 500 });
  }
}
