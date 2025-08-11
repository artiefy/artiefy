import { type NextRequest, NextResponse } from "next/server";

import { getUserData } from "~/models/educatorsModels/datosDashboard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  try {
    if (!userId) {
      return NextResponse.json(
        { message: "Parámetros incorrectos" },
        { status: 400 },
      );
    }

    const data = await getUserData(userId);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los datos del usuario:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
