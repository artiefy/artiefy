import { NextRequest, NextResponse } from 'next/server';

import { and,eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userProgramPrice } from '~/server/db/schema';

export async function GET(req: NextRequest) {
  console.log('➡️ Endpoint GET /price_program iniciado');

  const userId = req.nextUrl.searchParams.get('userId');
  const programaId = req.nextUrl.searchParams.get('programaId');

  console.log('🔹 Parámetros recibidos:', { userId, programaId });

  if (!userId || !programaId) {
    console.warn('⚠️ Faltan parámetros requeridos');
    return NextResponse.json(
      { error: 'userId y programaId son requeridos' },
      { status: 400 }
    );
  }

  const programaIdInt = Number(programaId);
  console.log('🔹 ProgramaId convertido a número:', programaIdInt);

  try {
    console.log('💡 Consultando base de datos...');
    const record = await db
      .select()
      .from(userProgramPrice)
      .where(
        and(
          eq(userProgramPrice.userId, userId),
          eq(userProgramPrice.programaId, programaIdInt)
        )
      )
      .limit(1);

    console.log('💡 Registro obtenido de DB:', record);

    if (record[0]) {
      console.log('✅ Registro encontrado, preparando respuesta');
      return NextResponse.json({
        ...record[0],
        createdAt: record[0].createdAt.toISOString(),
        updatedAt: record[0].updatedAt.toISOString(),
      });
    } else {
      console.log('⚠️ No se encontró registro, usando valores por defecto');
      const now = new Date().toISOString();
      const defaultResponse = {
        userId,
        programaId: programaIdInt,
        price: 1800000,
        numCuotas: 12,
        createdAt: now,
        updatedAt: now,
      };
      console.log('💡 Respuesta por defecto:', defaultResponse);
      return NextResponse.json(defaultResponse);
    }
  } catch (err) {
    console.error('❌ Error al consultar DB:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, programaId, price } = body;

  if (!userId || !programaId || price == null) {
    return NextResponse.json({ error: 'Campos incompletos' }, { status: 400 });
  }

  const inserted = await db
    .insert(userProgramPrice)
    .values({ userId, programaId, price })
    .returning();

  return NextResponse.json(inserted[0]);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { userId, programaId, price } = body;

  if (!userId || !programaId || price == null) {
    return NextResponse.json({ error: 'Campos incompletos' }, { status: 400 });
  }

  // Convertimos tipos correctamente
  const userIdStr = String(userId);
  const programaIdInt = Number(programaId);

  console.log('Buscando registro:', { userIdStr, programaIdInt });

const existing = await db
  .select()
  .from(userProgramPrice)
  .where(
    and(
      eq(userProgramPrice.userId, userIdStr),
      eq(userProgramPrice.programaId, programaIdInt)
    )
  )
  .limit(1);

if (existing.length === 0) {
  // Insertar el registro si no existe
  const inserted = await db
    .insert(userProgramPrice)
    .values({ userId: userIdStr, programaId: programaIdInt, price })
    .returning();
  return NextResponse.json(inserted[0]);
}


console.log('Registro encontrado:', existing);


  const updated = await db
    .update(userProgramPrice)
    .set({ price, updatedAt: new Date() })
    .where(
      and(
        eq(userProgramPrice.userId, userIdStr),
        eq(userProgramPrice.programaId, programaIdInt)
      )
    )
    .returning();

  if (!updated[0]) {
    return NextResponse.json({ error: 'No se encontró el registro' }, { status: 404 });
  }

  return NextResponse.json({
    ...updated[0],
    updatedAt: updated[0].updatedAt.toISOString(),
  });
}
