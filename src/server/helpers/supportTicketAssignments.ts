import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { db } from '~/server/db';
import { ticketAssignees, users } from '~/server/db/schema';

export const SUPPORT_AUTO_ASSIGN_EMAILS = ['direcciongeneral@artiefy.com'];

export async function getOrCreateUserByEmail(
  email: string,
  defaultRole:
    | 'super-admin'
    | 'admin'
    | 'educador'
    | 'estudiante' = 'super-admin'
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) return existing;

  const generatedId = `support_${randomUUID()}`;
  const insertedRows = await db
    .insert(users)
    .values({
      id: generatedId,
      email,
      role: defaultRole,
      name: null,
    })
    .onConflictDoNothing({ target: [users.email, users.role] })
    .returning();

  if (insertedRows.length > 0) {
    return insertedRows[0];
  }

  const fallback = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!fallback) {
    throw new Error(
      `No se pudo crear ni recuperar el usuario con email ${email}`
    );
  }

  return fallback;
}

export async function ensureTicketAssignment(ticketId: number, userId: string) {
  await db
    .insert(ticketAssignees)
    .values({ ticketId, userId })
    .onConflictDoNothing({
      target: [ticketAssignees.ticketId, ticketAssignees.userId],
    });
}
