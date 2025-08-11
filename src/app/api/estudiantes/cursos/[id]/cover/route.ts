import { NextResponse } from "next/server";

import { getCourseById } from "~/server/actions/estudiantes/courses/getCourseById";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const courseId = Number(id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: "ID de curso inválido" },
        { status: 400 },
      );
    }

    // No necesitas userId para la portada pública
    const course = await getCourseById(courseId, null);

    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }

    const coverImageUrl = course.coverImageKey
      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
      : "https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT";

    return NextResponse.json({ coverImageUrl });
  } catch (_error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
