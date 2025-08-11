import { NextResponse } from "next/server";

import { getForumById } from "~/models/educatorsModels/forumAndPosts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: "ID de curso inválido" },
        { status: 400 },
      );
    }

    const forum = await getForumById(courseId);
    if (!forum) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(forum);
  } catch (error) {
    console.error("Error al obtener el foro:", error);
    return NextResponse.json(
      { error: "Error al obtener el foro" },
      { status: 500 },
    );
  }
}
