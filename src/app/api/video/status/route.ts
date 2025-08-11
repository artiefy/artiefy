import { NextResponse } from "next/server";

import { getLessonById } from "~/models/educatorsModels/lessonsModels";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId");

  if (!lessonId) {
    return NextResponse.json(
      { error: "Se requiere el ID de la lección" },
      { status: 400 },
    );
  }

  try {
    const lesson = await getLessonById(Number(lessonId));

    if (!lesson) {
      return NextResponse.json(
        { error: "Lección no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      coverVideoKey: lesson.coverVideoKey,
      message: lesson.coverVideoKey
        ? "Video subido exitosamente"
        : "Video aún no subido",
    });
  } catch (error) {
    console.error("Error al consultar el estado del video:", error);
    return NextResponse.json(
      { error: "Error al consultar el estado del video" },
      { status: 500 },
    );
  }
}
