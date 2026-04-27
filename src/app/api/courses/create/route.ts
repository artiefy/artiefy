import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint de creacion de cursos no implementado' },
    { status: 501 }
  );
}
