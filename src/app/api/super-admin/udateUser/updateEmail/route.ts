/**
 * PATCH /api/super-admin/udateUser/updateEmail  { userId, email }
 *
 * Cambia ÚNICAMENTE el correo del usuario en Clerk y en la BD, conservando el
 * mismo id (no afecta matrículas ni progreso). No toca ningún otro campo, a
 * diferencia de updateFullUser que reescribe todo el usuario.
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(req: Request) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    userId?: string;
    email?: string;
  } | null;
  const userId = body?.userId?.trim();
  const email = body?.email?.trim();

  if (!userId || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'Correo o usuario inválidos' },
      { status: 400 }
    );
  }

  try {
    // Unicidad en la BD ANTES de tocar Clerk: si otro usuario ya tiene ese
    // correo, se corta aquí. Así no se cambia Clerk para luego fallar la BD y
    // dejar ambos lados inconsistentes.
    const existente = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .then((r) => r[0]);
    if (existente && existente.id !== userId) {
      return NextResponse.json(
        { error: 'Ese correo ya está en uso por otro usuario.' },
        { status: 409 }
      );
    }

    const client = await clerkClient();

    // Puede existir en la BD pero no en Clerk (usuarios solo-BD). Si no está en
    // Clerk, se omite el cambio allá y solo se actualiza la BD.
    let u: Awaited<ReturnType<typeof client.users.getUser>> | null = null;
    try {
      u = await client.users.getUser(userId);
    } catch {
      u = null;
    }

    // Cambia el email en Clerk SIN cambiar el id: agrega el nuevo correo como
    // verificado+primario y elimina los anteriores. Misma lógica que
    // updateFullUser, pero acotada solo al correo.
    if (u) {
      const target = email.toLowerCase();
      const anterioresIds = u.emailAddresses.map((e) => e.id);
      const yaLoTiene = u.emailAddresses.find(
        (e) => e.emailAddress.toLowerCase() === target
      );

      let nuevoId: string;
      try {
        if (yaLoTiene) {
          await client.emailAddresses.updateEmailAddress(yaLoTiene.id, {
            verified: true,
            primary: true,
          });
          nuevoId = yaLoTiene.id;
        } else {
          const creado = await client.emailAddresses.createEmailAddress({
            userId,
            emailAddress: email,
            verified: true,
            primary: true,
          });
          nuevoId = creado.id;
        }
        for (const oldId of anterioresIds) {
          if (oldId !== nuevoId) {
            try {
              await client.emailAddresses.deleteEmailAddress(oldId);
            } catch (delErr) {
              console.warn('No se pudo borrar email anterior:', delErr);
            }
          }
        }
      } catch (emailErr: unknown) {
        const e = emailErr as { errors?: { code?: string }[] };
        const enUso = e.errors?.some(
          (x) => x.code === 'form_identifier_exists'
        );
        return NextResponse.json(
          {
            error: enUso
              ? 'Ese correo ya está en uso por otro usuario.'
              : 'No se pudo cambiar el correo en Clerk.',
          },
          { status: enUso ? 409 : 500 }
        );
      }
    }

    // Actualiza SOLO el email en la BD (nada más).
    await db.update(users).set({ email }).where(eq(users.id, userId));

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('[updateEmail] error:', error);
    const mensaje =
      error instanceof Error
        ? error.message
        : 'No se pudo actualizar el correo';
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
