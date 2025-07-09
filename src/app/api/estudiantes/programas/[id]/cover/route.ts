import { NextResponse } from 'next/server';

import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de programa inválido' },
        { status: 400 }
      );
    }

    const program = await getProgramById(id);

    if (!program) {
      return NextResponse.json(
        { error: 'Programa no encontrado' },
        { status: 404 }
      );
    }

    const coverImageUrl = program.coverImageKey
      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
      : 'https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';

    return NextResponse.json({ coverImageUrl });
  } catch (_error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
