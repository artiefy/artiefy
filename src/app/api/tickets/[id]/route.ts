import { NextResponse } from "next/server";

import { getTicketsByUserId } from "~/models/educatorsModels/ticketsModels";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
        { status: 400 },
      );
    }

    const tickets = await getTicketsByUserId(userId);

    if (!tickets) {
      return NextResponse.json(
        { error: "Tickets no encontrados para este usuario" },
        { status: 404 },
      );
    }

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error al obtener los tickets:", error);
    return NextResponse.json(
      { error: "Error al obtener los tickets" },
      { status: 500 },
    );
  }
}
