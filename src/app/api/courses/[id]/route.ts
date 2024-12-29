import { type NextRequest, NextResponse } from "next/server";
import { getCourseById } from "~/models/courseModels";

export const dynamic = 'force-dynamic'; 

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  
  try {
    const course = await getCourseById(Number(id));
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
