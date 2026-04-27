import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint de edicion de actividades no implementado' },
    { status: 501 }
  );
}
