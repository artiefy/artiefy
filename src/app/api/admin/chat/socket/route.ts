import { NextResponse } from 'next/server';

// ✅ Ruta desactivada: no inicializa Socket.IO.
export function GET() {
  return NextResponse.json({ socket: 'disabled' });
}
