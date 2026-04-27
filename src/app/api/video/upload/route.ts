import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint de carga de video no implementado' },
    { status: 501 }
  );
}
