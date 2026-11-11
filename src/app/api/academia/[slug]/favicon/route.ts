import { NextResponse } from 'next/server';

import { urlLogo } from '~/lib/academy/marca';
import { academiaPorSlug } from '~/server/academy/academias';
import { obtenerAjustes } from '~/server/academy/ajustes';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const academia = await academiaPorSlug((await params).slug);
  if (!academia) {
    return new NextResponse(null, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const { faviconKey } = await obtenerAjustes(academia.id);
  const icono = urlLogo(faviconKey) ?? urlLogo(academia.logoKey);

  return NextResponse.redirect(
    icono ?? new URL('/artiefy-icon.png', request.url),
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
