import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint de estado de suscripcion no implementado' },
    { status: 501 }
  );
}
