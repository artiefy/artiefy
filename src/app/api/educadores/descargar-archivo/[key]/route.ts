import { NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
  _request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    console.log(`Fetching file with key: ${key}`); // Agregar log para depuración
    const respuesta = await redis.hgetall(key);

    if (!respuesta) {
      console.error(`No data found for key: ${key}`); // Agregar log para depuración
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    if (!respuesta.fileContent) {
      console.error(`Empty file content for key: ${key}`); // Agregar log para depuración
      return NextResponse.json(
        { error: 'Contenido del archivo vacío' },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(respuesta.fileContent as string, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${respuesta.fileName as string}"`,
      },
    });
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    return NextResponse.json(
      { error: 'Error al descargar el archivo' },
      { status: 500 }
    );
  }
}
