import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ✅ Ruta desactivada: no inicializa Socket.IO.
export function GET() {
  return NextResponse.json({ socket: 'disabled' });
}
