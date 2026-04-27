import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint de curso no implementado' },
    { status: 501 }
  );
}
