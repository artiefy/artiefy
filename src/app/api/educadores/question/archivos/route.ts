import { type NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";

import type { QuestionFilesSubida } from "~/types/typesActi";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ✅ GET - Obtener preguntas con archivos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");

    if (!activityId) {
      console.warn("[GET] activityId no proporcionado");
      return NextResponse.json(
        { success: false, message: "Se requiere activityId" },
        { status: 400 },
      );
    }

    const key = `activity:${activityId}:questionsFilesSubida`;
    const questionsFilesSubida =
      (await redis.get<QuestionFilesSubida[]>(key)) ?? [];

    console.log(`[GET] 🔍 Clave Redis: ${key}`);
    console.log(
      `[GET] ✅ Preguntas obtenidas (${questionsFilesSubida.length}):`,
      questionsFilesSubida,
    );

    return NextResponse.json({
      success: true,
      questionsFilesSubida,
    });
  } catch (error) {
    console.error("[GET] ❌ Error en la API:", error);
    return NextResponse.json(
      { success: false, message: "Error en el servidor" },
      { status: 500 },
    );
  }
}

// ✅ POST - Guardar nueva pregunta con archivos
export async function POST(request: NextRequest) {
  try {
    const { activityId, questionsFilesSubida } = (await request.json()) as {
      activityId: string;
      questionsFilesSubida: QuestionFilesSubida;
    };

    console.log("[POST] 📨 Datos recibidos:", {
      activityId,
      questionsFilesSubida,
    });

    const key = `activity:${activityId}:questionsFilesSubida`;
    const existingQuestions =
      (await redis.get<QuestionFilesSubida[]>(key)) ?? [];

    const updatedQuestions = [...existingQuestions, questionsFilesSubida];

    console.log("[POST] 🔑 Clave Redis:", key);
    console.log("[POST] ✏️ Actualizando Redis con:", updatedQuestions);

    await redis.set(key, updatedQuestions);

    return NextResponse.json({
      success: true,
      message: "Pregunta guardada correctamente",
    });
  } catch (error) {
    console.error("[POST] ❌ Error al guardar la pregunta:", error);
    return NextResponse.json(
      { success: false, message: "Error al guardar la pregunta" },
      { status: 500 },
    );
  }
}

// ✅ PUT - Actualizar una pregunta existente
export async function PUT(request: NextRequest) {
  try {
    const { activityId, questionsFilesSubida } = (await request.json()) as {
      activityId: string;
      questionsFilesSubida: QuestionFilesSubida;
    };

    const key = `activity:${activityId}:questionsFilesSubida`;
    const existingQuestions =
      (await redis.get<QuestionFilesSubida[]>(key)) ?? [];

    const updatedQuestions = existingQuestions.map((q) =>
      q.id === questionsFilesSubida.id ? questionsFilesSubida : q,
    );

    console.log("[PUT] ✏️ Pregunta actualizada:", questionsFilesSubida);

    await redis.set(key, updatedQuestions);

    return NextResponse.json({
      success: true,
      message: "Pregunta actualizada correctamente",
    });
  } catch (error) {
    console.error("[PUT] ❌ Error al actualizar la pregunta:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar la pregunta" },
      { status: 500 },
    );
  }
}

// ✅ DELETE - Eliminar una pregunta
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");
    const questionId = searchParams.get("questionId");

    if (!activityId || !questionId) {
      console.warn("[DELETE] 🚫 activityId o questionId faltantes");
      return NextResponse.json(
        { success: false, message: "Se requieren activityId y questionId" },
        { status: 400 },
      );
    }

    const key = `activity:${activityId}:questionsFilesSubida`;
    const existingQuestions =
      (await redis.get<QuestionFilesSubida[]>(key)) ?? [];

    const updatedQuestions = existingQuestions.filter(
      (q) => q.id !== questionId,
    );

    console.log(`[DELETE] 🗑 Eliminando pregunta con ID: ${questionId}`);

    await redis.set(key, updatedQuestions);

    return NextResponse.json({
      success: true,
      message: "Pregunta eliminada correctamente",
    });
  } catch (error) {
    console.error("[DELETE] ❌ Error al eliminar la pregunta:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar la pregunta" },
      { status: 500 },
    );
  }
}
