/* eslint-disable */
import { NextResponse } from 'next/server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { desc, ilike, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { credentialsDeliveryLogs } from '~/server/db/schema';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const client = await clerkClient();
    const me = await client.users.getUser(userId);
    const role = (me.publicMetadata as any)?.role;

    if (role !== 'super-admin') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get('pageSize') ?? '20'))
    );
    const offset = (page - 1) * pageSize;

    const whereClause = q
      ? or(
          ilike(credentialsDeliveryLogs.usuario, `%${q}%`),
          ilike(credentialsDeliveryLogs.correo, `%${q}%`),
          ilike(credentialsDeliveryLogs.nota, `%${q}%`)
        )
      : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select({
          id: credentialsDeliveryLogs.id,
          userId: credentialsDeliveryLogs.userId,
          usuario: credentialsDeliveryLogs.usuario,
          contrasena: credentialsDeliveryLogs.contrasena,
          correo: credentialsDeliveryLogs.correo,
          nota: credentialsDeliveryLogs.nota,
          createdAt: credentialsDeliveryLogs.createdAt,
        })
        .from(credentialsDeliveryLogs)
        .where(whereClause)
        .orderBy(desc(credentialsDeliveryLogs.createdAt))
        .limit(pageSize)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(credentialsDeliveryLogs)
        .where(whereClause),
    ]);

    const total = totalRes?.[0]?.count ?? 0;

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items,
    });
  } catch (err) {
    console.error('GET credentials-logs error:', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const client = await clerkClient();
    const me = await client.users.getUser(userId);
    const role = (me.publicMetadata as any)?.role;

    if (role !== 'super-admin') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();

    const usuario = String(body.usuario ?? '').trim();
    const correo = String(body.correo ?? '').trim();
    const nota = String(body.nota ?? '').trim();
    const contrasena = body.contrasena ? String(body.contrasena) : null;
    const refUserId = body.userId ? String(body.userId) : null;

    if (!usuario || !correo || !nota) {
      return NextResponse.json(
        { message: 'usuario, correo y nota son obligatorios' },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(credentialsDeliveryLogs)
      .values({
        userId: refUserId,
        usuario,
        correo,
        nota,
        contrasena,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST credentials-logs error:', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
