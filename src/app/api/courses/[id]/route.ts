import { type NextRequest, NextResponse } from "next/server";
import { getCourseById } from "~/models/courseModels";

export const dynamic = 'force-dynamic'; 

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    const courseId = Number(id);
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
  } catch {    
    return NextResponse.json(
      { error: "Error al obtener el curso" },
      { status: 500 },
    );
  }
}
