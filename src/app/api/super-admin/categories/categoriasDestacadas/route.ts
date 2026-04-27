import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint de categorias destacadas no implementado' },
    { status: 501 }
  );
}
