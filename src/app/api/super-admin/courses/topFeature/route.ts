import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { courses } from "~/server/db/schema";

export async function GET() {
  try {
    const result = await db
      .select({
        id: courses.id,
        title: courses.title,
        is_top: courses.is_top,
        is_featured: courses.is_featured,
      })
      .from(courses);

    return NextResponse.json({ courses: result });
  } catch (error) {
    console.error("Error en GET /topFeature:", error);
    return NextResponse.json(
      { error: "Error al obtener los cursos" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      id,
      field,
      value,
    }: { id: number; field: "is_top" | "is_featured"; value: boolean } =
      await req.json();

    if (!id || (field !== "is_top" && field !== "is_featured")) {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 },
      );
    }

    await db
      .update(courses)
      .set({ [field]: value })
      .where(eq(courses.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error en POST /topFeature:", error);
    return NextResponse.json(
      { error: "Error al actualizar el curso" },
      { status: 500 },
    );
  }
}
