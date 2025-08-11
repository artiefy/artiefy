import { NextResponse } from "next/server";

import { db } from "~/server/db";
import { permisos } from "~/server/db/schema";

export async function GET() {
  try {
    const allPermisos = await db.select().from(permisos);
    return NextResponse.json(allPermisos);
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
