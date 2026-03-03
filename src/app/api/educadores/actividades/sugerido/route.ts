import { type NextRequest, NextResponse } from 'next/server';

import { getSuggestedPercentage } from '~/server/queries/getSuggestedPercentage';

// GET /api/educadores/actividades/sugerido?parametroId=XX
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parametroId = searchParams.get('parametroId');
  if (!parametroId) {
    return NextResponse.json(
      { error: 'parametroId es requerido' },
      { status: 400 }
    );
  }
  const sugerido = await getSuggestedPercentage(Number(parametroId));
  return NextResponse.json({ porcentajeSugerido: sugerido });
}
