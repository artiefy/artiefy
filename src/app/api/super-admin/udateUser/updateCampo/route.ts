/**
 * PATCH /api/super-admin/udateUser/updateCampo  { userId, field, value }
 *
 * Actualiza ÚNICAMENTE un campo permitido del usuario en la BD (y, para el
 * nombre, también en Clerk conservando el id). No toca ningún otro campo, a
 * diferencia de updateFullUser que reescribe todo el usuario.
 *
 * Campos permitidos: name, phone, identificacionNumero.
 * (El correo se cambia aparte en /updateEmail por su lógica de Clerk.)
 */

import { NextResponse } from 'next/server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

const CAMPOS_PERMITIDOS = ['name', 'phone', 'identificacionNumero'] as const;
type CampoPermitido = (typeof CAMPOS_PERMITIDOS)[number];

export async function PATCH(req: Request) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    userId?: string;
    field?: string;
    value?: string;
  } | null;
  const userId = body?.userId?.trim();
  const field = body?.field as CampoPermitido | undefined;
  const value = typeof body?.value === 'string' ? body.value.trim() : '';

  if (!userId || !field || !CAMPOS_PERMITIDOS.includes(field)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    switch (field) {
      case 'name': {
        // También actualiza el nombre en Clerk (si el usuario existe allá).
        const client = await clerkClient();
        let enClerk = true;
        try {
          await client.users.getUser(userId);
        } catch {
          enClerk = false;
        }
        if (enClerk) {
          const parts = value.split(/\s+/).filter(Boolean);
          const firstName = parts[0] ?? '';
          const lastName = parts.slice(1).join(' ');
          try {
            await client.users.updateUser(userId, { firstName, lastName });
          } catch (e) {
            console.warn(
              '[updateCampo] no se pudo actualizar nombre en Clerk:',
              e
            );
          }
        }
        await db.update(users).set({ name: value }).where(eq(users.id, userId));
        break;
      }
      case 'phone':
        await db
          .update(users)
          .set({ phone: value || null })
          .where(eq(users.id, userId));
        break;
      case 'identificacionNumero':
        await db
          .update(users)
          .set({ identificacionNumero: value || null })
          .where(eq(users.id, userId));
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[updateCampo] error:', error);
    const mensaje =
      error instanceof Error ? error.message : 'No se pudo actualizar el campo';
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
