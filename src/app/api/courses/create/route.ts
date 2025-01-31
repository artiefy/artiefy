import { NextResponse } from 'next/server';
import { POST as createCourse } from '~/server/actions/courses/coursesCreate';

export async function POST(request: Request) {
  try {
    // Validar si el request tiene cuerpo
    if (!request.body) {
      return NextResponse.json({ error: "Cuerpo vacío en la solicitud" }, { status: 400 });
    }

    // Leer el cuerpo del request
    const body = await request.json();
    console.log("📡 Recibido en API Route:", body);

    // Enviar la solicitud a coursesCreate.ts
    const response = await createCourse(new Request(request, { body: JSON.stringify(body) }));

    return response;
  } catch (error) {
    console.error("❌ Error en API create:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
