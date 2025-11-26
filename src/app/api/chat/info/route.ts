import { NextRequest, NextResponse } from 'next/server';

interface BackendResponse {
  result?: unknown;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la petición
    const body = await request.json();
    const { user_id, curso, prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'El campo prompt es requerido' },
        { status: 400 }
      );
    }

    // Petición al backend externo
    const response = await fetch('http://3.142.77.31:5000/get_classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_id ?? 'anonymous',
        curso: curso ?? 'general',
        prompt,
      }),
    });

    // Si el backend devuelve error HTTP
    if (!response.ok) {
      const text = await response.text(); // Intentar leer aunque sea texto
      console.error('Backend externo devolvió error:', response.status, text);
      return NextResponse.json(
        { error: 'Error desde backend externo', details: text },
        { status: response.status }
      );
    }

    // Manejo si la respuesta está vacía
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Backend no devolvió JSON. Texto recibido:', text);
      return NextResponse.json({ result: text }, { status: 200 });
    }

    // Parsear JSON normalmente
    const data = (await response.json()) as BackendResponse;

    return NextResponse.json({ result: data.result ?? data }, { status: 200 });
  } catch (error) {
    console.error('Error en la petición POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
