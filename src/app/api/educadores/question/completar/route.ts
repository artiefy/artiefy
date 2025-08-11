import { type NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";

import type { Completado } from "~/types/typesActi";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");
    if (!activityId) {
      return NextResponse.json(
        { success: false, message: "Se requiere activityId" },
        { status: 400 },
      );
    }
    const key = `activity:${activityId}:questionsACompletar`;
    const questionsACompletar = (await redis.get<Completado[]>(key)) ?? [];
    return NextResponse.json({ success: true, questionsACompletar });
  } catch (error) {
    console.error("Error en la API route:", error);
    return NextResponse.json(
      { success: false, message: "Error en el servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { activityId, questionsACompletar } = (await request.json()) as {
      activityId: string;
      questionsACompletar: Completado;
    };
    if (!activityId || !questionsACompletar) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requieren activityId y questionsACompletar",
        },
        { status: 400 },
      );
    }
    const key = `activity:${activityId}:questionsACompletar`;
    const existingQuestions = (await redis.get<Completado[]>(key)) ?? [];

    const updatedQuestions = [...existingQuestions, questionsACompletar];
    await redis.set(key, updatedQuestions);
    return NextResponse.json({
      success: true,
      message: "Pregunta guardada correctamente",
    });
  } catch (error) {
    console.error("Error al guardar la pregunta:", error);
    return NextResponse.json(
      { success: false, message: "Error al guardar la pregunta" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { activityId, questionsACompletar } = (await request.json()) as {
      activityId: string;
      questionsACompletar: Completado;
    };
    if (!activityId || !questionsACompletar) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requieren activityId y questionsACompletar",
        },
        { status: 400 },
      );
    }
    const key = `activity:${activityId}:questionsACompletar`;
    const existingQuestions = (await redis.get<Completado[]>(key)) ?? [];

    const updatedQuestions = existingQuestions.map((q) =>
      q?.id === questionsACompletar.id ? questionsACompletar : q,
    );
    await redis.set(key, updatedQuestions);
    return NextResponse.json({
      success: true,
      message: "Pregunta actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar la pregunta:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar la pregunta" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");
    const questionId = searchParams.get("questionId");
    if (!activityId || !questionId) {
      return NextResponse.json(
        { success: false, message: "Se requieren activityId y questionId" },
        { status: 400 },
      );
    }
    const key = `activity:${activityId}:questionsACompletar`;
    const existingQuestions = (await redis.get<Completado[]>(key)) ?? [];
    const updatedQuestions = existingQuestions.filter(
      (q) => q && q.id !== questionId,
    );
    await redis.set(key, updatedQuestions);
    return NextResponse.json({
      success: true,
      message: "Pregunta eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar la pregunta:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar la pregunta" },
      { status: 500 },
    );
  }
}
