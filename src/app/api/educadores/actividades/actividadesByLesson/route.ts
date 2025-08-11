import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import {
  getActivitiesByLessonId,
  getTotalPorcentajeByParametro,
} from "~/models/educatorsModels/activitiesModels";

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// GET endpoint para obtener una actividad por ID
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError("No autorizado", 403);
    }

    const { searchParams } = new URL(request.url);
    const lessonsId = searchParams.get("lessonId");
    if (!lessonsId) {
      return respondWithError("ID de actividad no proporcionado", 400);
    }

    const activities = await getActivitiesByLessonId(parseInt(lessonsId, 10));
    if (!activities) {
      return respondWithError("Actividad no encontrada", 404);
    }

    return NextResponse.json(activities);
  } catch (error: unknown) {
    console.error("Error al obtener la actividad:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return respondWithError(
      `Error al obtener la actividad: ${errorMessage}`,
      500,
    );
  }
}

// Agregar nueva ruta para validar porcentaje
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return respondWithError("No autorizado", 403);

  const data = (await request.json()) as {
    parametroId?: number;
    porcentaje?: number;
    actividadId?: number;
  };
  console.log("🔔 validarPorcentaje POST body:", data);

  const { parametroId, porcentaje, actividadId } = data;
  if (parametroId == null || porcentaje == null) {
    return respondWithError(
      "Datos incompletos (parametroId y porcentaje son required)",
      400,
    );
  }

  // 1) suma total en BD
  const resultado = await getTotalPorcentajeByParametro(parametroId);
  let total = resultado.total;

  // 2) si es edición, restamos el viejo de esta actividad
  if (actividadId != null) {
    const actual = resultado.actividades.find((a) => a.id === actividadId);
    if (actual) {
      total -= actual.porcentaje;
      console.log(
        `↪️ Excluyendo porcentaje viejo de actividad ${actividadId}:`,
        actual.porcentaje,
        "nuevo total:",
        total,
      );
    }
  }

  const nuevoTotal = total + porcentaje;

  // 3) validación
  if (nuevoTotal > 100 || nuevoTotal < 0) {
    return respondWithError(
      `No se puede exceder el 100% del parámetro. Actual: ${total}%, Añadiendo: ${porcentaje}%.`,
      400,
    );
  }

  // 4) OK
  return NextResponse.json({
    isValid: true,
    totalActual: total,
    disponible: 100 - total,
    detalles: resultado.actividades,
  });
}
