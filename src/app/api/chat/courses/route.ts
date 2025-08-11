// app/api/root-courses/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'El campo prompt es requerido' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch('http://3.142.77.31:5000/root_courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: 'Error desde backend externo', details: errorText },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    // Forzar siempre el formato { result: [...] }
    return NextResponse.json(
      { result: Array.isArray(data.result) ? data.result : [data.result] },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en POST /api/root-courses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
