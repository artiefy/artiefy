import { NextResponse } from "next/server";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { materias } from "~/server/db/schema";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    // Si no hay courseId, devolver materias únicas sin programa
    if (!courseId) {
      const materiasUnicas = await db
        .select({
          id: sql`MIN(${materias.id})`.as("id"),
          title: materias.title,
          programaId: materias.programaId,
        })
        .from(materias)
        .where(isNull(materias.programaId))
        .groupBy(materias.title, materias.programaId);

      return NextResponse.json(materiasUnicas);
    }

    // 1. Obtener todas las materias del curso
    const materiasDelCurso = await db
      .select()
      .from(materias)
      .where(eq(materias.courseid, parseInt(courseId)));

    if (!materiasDelCurso?.length) {
      // Si no hay materia para ese curso, devolver todas las materias sin programa
      const materiasUnicas = await db
        .select({
          id: sql`MIN(${materias.id})`.as("id"),
          title: materias.title,
          programaId: materias.programaId,
        })
        .from(materias)
        .where(isNull(materias.programaId))
        .groupBy(materias.title, materias.programaId);

      return NextResponse.json(materiasUnicas);
    }

    const programId = materiasDelCurso[0].programaId;

    if (!programId) {
      return NextResponse.json([...materiasDelCurso]);
    }

    // 2. Obtener todas las demás materias del programa (excluyendo las del curso)
    const otrasMaterias = await db
      .select({
        id: sql`MIN(${materias.id})`.as("id"),
        title: materias.title,
        programaId: materias.programaId,
      })
      .from(materias)
      .where(
        and(
          eq(materias.programaId, programId),
          sql`${materias.title} NOT IN (${materiasDelCurso
            .map((m) => `'${m.title}'`)
            .join(", ")})`,
        ),
      )
      .groupBy(materias.title, materias.programaId);

    // 3. Combinar las materias del curso con las otras materias
    const resultado = [...materiasDelCurso, ...otrasMaterias];

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("❌ Error detallado:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
