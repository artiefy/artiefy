import { type NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";
import axios, { isAxiosError } from "axios";

import { db } from "~/server/db";
import { lessons } from "~/server/db/schema";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Tipar correctamente los elementos de transcripción
interface TranscriptionItem {
  start: number;
  end: number;
  text: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId es requerido" },
        { status: 400 },
      );
    }

    const redisKey = `transcription:lesson:${lessonId}`;
    const transcription = await redis.get<TranscriptionItem[] | string>(
      redisKey,
    );

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcripción no encontrada para esta lección" },
        { status: 404 },
      );
    }

    const formatTime = (seconds: number): string => {
      const totalSecs = Math.floor(seconds);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const textContent = Array.isArray(transcription)
      ? transcription
          .map((item) =>
            item && typeof item === "object" && "text" in item
              ? `${formatTime(item.start)} ${item.text} ${formatTime(item.end)}`
              : "",
          )
          .join("\n")
      : transcription;

    return new NextResponse(textContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="transcription-${lessonId}.txt"`,
      },
    });
  } catch (error) {
    console.error("[TRANSCRIPCIÓN] ❌ Error al obtener transcripción:", error);
    return NextResponse.json(
      { error: "Error al obtener la transcripción" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    // ✅ CONFIGURA TU VIDEO MANUAL AQUÍ
    const manualLessonId = 265; // 👈 Cambia a 0 para usar modo masivo
    const manualVideoUrl =
      "https://s3.us-east-2.amazonaws.com/artiefy-upload/uploads/video-corporativo1080-1747179011696-ab77ff51-074d-4f6c-abdf-1be20e8a79fc-1747786015742-3f62f9ed-eaeb-4442-b444-3bd66610bdc4.mp4"; // 👈 Tu video URL

    // 🔹 MODO MANUAL: solo si lessonId !== 0 y URL no está vacío
    if (Number(manualLessonId) !== 0 && manualVideoUrl.trim()) {
      const redisKey = `transcription:lesson:${manualLessonId}`;
      const alreadyExists = await redis.get(redisKey);

      if (alreadyExists) {
        console.log(
          `[TRANSCRIPCIÓN] 🟡 Ya existe transcripción para lección ${manualLessonId}`,
        );
        return NextResponse.json({
          message: `Ya existe una transcripción para la lección ${manualLessonId}`,
        });
      }

      // Verificar que el video se pueda acceder
      try {
        const check = await fetch(manualVideoUrl, { method: "HEAD" });
        if (!check.ok) {
          console.error(
            `[TRANSCRIPCIÓN] ❌ Video no accesible. Status: ${check.status}`,
          );
          return NextResponse.json(
            { error: `Video no accesible (status ${check.status})` },
            { status: 400 },
          );
        }
      } catch (err) {
        console.error(
          `[TRANSCRIPCIÓN] ❌ Error al verificar el video manual:`,
          err,
        );
        return NextResponse.json(
          { error: "Error al verificar el video" },
          { status: 400 },
        );
      }

      // Procesar el video manual
      try {
        const response = await axios.post(
          "http://3.148.245.81:8000/video2text",
          { url: manualVideoUrl },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 20 * 60 * 1000,
          },
        );

        if (!Array.isArray(response.data)) {
          console.error(
            `[TRANSCRIPCIÓN] ❌ Formato inválido para lección ${manualLessonId}:`,
            response.data,
          );
          return NextResponse.json(
            { error: "Formato de transcripción no válido" },
            { status: 422 },
          );
        }

        await redis.set(redisKey, response.data);
        console.log(
          `[TRANSCRIPCIÓN] ✅ Guardada transcripción para lección ${manualLessonId}`,
        );

        return NextResponse.json({
          message: `Transcripción manual completada para la lección ${manualLessonId}`,
        });
      } catch (err) {
        if (isAxiosError(err)) {
          console.error(`Axios Error (manual):`, err.message);
          console.error("Response data:", err.response?.data);
        } else {
          console.error(`Error genérico (manual):`, err);
        }

        return NextResponse.json(
          { error: "Error procesando la transcripción manual" },
          { status: 500 },
        );
      }
    }

    // 🔹 MODO MASIVO: solo se ejecuta si manualLessonId === 0
    const allLessons = await db
      .select({
        id: lessons.id,
        coverVideoKey: lessons.coverVideoKey,
      })
      .from(lessons);

    const AWS_BASE_URL = "https://s3.us-east-2.amazonaws.com/artiefy-upload/";
    const existingKeys = await redis.keys("transcription:lesson:*");
    const alreadyProcessedIds = new Set(
      existingKeys.map((key: string) =>
        key.replace("transcription:lesson:", ""),
      ),
    );

    const lessonsToProcess = allLessons.filter((lesson) => {
      return (
        lesson.coverVideoKey && !alreadyProcessedIds.has(lesson.id.toString())
      );
    });

    if (lessonsToProcess.length === 0) {
      console.log(
        "[TRANSCRIPCIÓN] ✅ No hay lecciones nuevas por transcribir.",
      );
      return NextResponse.json({
        message: "Todas las lecciones ya tienen transcripción.",
      });
    }

    for (const lesson of lessonsToProcess) {
      const { id: lessonId, coverVideoKey } = lesson;
      const videoUrl = `${AWS_BASE_URL}${coverVideoKey}`;
      console.log(`[TRANSCRIPCIÓN] 📹 Procesando video: ${videoUrl}`);

      try {
        const check = await fetch(videoUrl, { method: "HEAD" });
        if (!check.ok) {
          console.error(
            `[TRANSCRIPCIÓN] ❌ Video no accesible para lección ${lessonId}. Status:`,
            check.status,
          );
          continue;
        }
      } catch (error) {
        console.error(`[TRANSCRIPCIÓN] ❌ Error al verificar el video:`, error);
        continue;
      }

      try {
        const response = await axios.post(
          "http://3.148.245.81:8000/video2text",
          { url: videoUrl },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 20 * 60 * 1000,
          },
        );

        if (!Array.isArray(response.data)) {
          console.error(
            `[TRANSCRIPCIÓN] ❌ Formato inválido para lección ${lessonId}:`,
            response.data,
          );
          continue;
        }

        const redisKey = `transcription:lesson:${lessonId}`;
        await redis.set(redisKey, response.data);
        console.log(
          `[TRANSCRIPCIÓN] ✅ Guardada transcripción para lección ${lessonId}`,
        );
      } catch (err) {
        if (isAxiosError(err)) {
          console.error(`Axios Error (lección ${lessonId}):`, err.message);
          console.error("Response data:", err.response?.data);
        } else {
          console.error(`Error genérico (lección ${lessonId}):`, err);
        }
      }
    }

    return NextResponse.json({
      message: "Transcripción completada para las lecciones pendientes.",
    });
  } catch (err) {
    console.error("[TRANSCRIPCIÓN] ❌ Error general:", err);
    return NextResponse.json(
      { error: "Error general al procesar las transcripciones" },
      { status: 500 },
    );
  }
}
