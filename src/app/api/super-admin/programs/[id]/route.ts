import { NextResponse } from "next/server";

import { getProgramById } from "~/server/actions/superAdmin/program/getProgramById";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const programId = params.id;
    const programData = await getProgramById(programId); // Rename variable to avoid conflict
    if (!programData) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    return NextResponse.json(programData);
  } catch (error) {
    console.error("Error fetching program:", error);
    return NextResponse.json(
      { error: "Error fetching program" },
      { status: 500 },
    );
  }
}
