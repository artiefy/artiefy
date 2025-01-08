import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCourseById, updateCourse } from "~/models/courseModels";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
    const data = await request.json();

    await updateCourse(courseId, {
      title: data.title,
      description: data.description,
      coverImageKey: data.coverImageKey,
      categoryid: data.categoryId,
      instructor: data.instructor,
      modalidadesid: data.modalidadesid,
    });

    // Obtener el curso actualizado
    const updatedCourse = await getCourseById(courseId);
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error al actualizar el curso:", error);
    return NextResponse.json(
      { error: "Error al actualizar el curso" },
      { status: 500 },
    );
  }
}
