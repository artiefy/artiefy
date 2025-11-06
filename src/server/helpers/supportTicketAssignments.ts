import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { db } from '~/server/db';
import { ticketAssignees, users } from '~/server/db/schema';

export const SUPPORT_AUTO_ASSIGN_EMAILS = ['direcciontecnologica@ciadet.co'];

export async function getOrCreateUserByEmail(
  email: string,
  defaultRole: 'super-admin' | 'admin' | 'educador' | 'estudiante' = 'admin'
) {
  console.log(
    `🔍 Buscando o creando usuario con email: ${email}, rol: ${defaultRole}`
  );

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    console.log(`✅ Usuario existente encontrado:`, {
      id: existing.id,
      email: existing.email,
      role: existing.role,
    });
    return existing;
  }

  console.log(
    `➕ Usuario no existe, creando nuevo usuario con rol ${defaultRole}...`
  );

  const generatedId = `support_${randomUUID()}`;
  const userName = email.split('@')[0]; // Usar parte del email como nombre

  try {
    const insertedRows = await db
      .insert(users)
      .values({
        id: generatedId,
        email,
        role: defaultRole,
        name: userName,
      })
      .onConflictDoNothing({ target: users.email })
      .returning();

    if (insertedRows.length > 0) {
      console.log(`✅ Usuario creado exitosamente:`, {
        id: insertedRows[0].id,
        email: insertedRows[0].email,
        role: insertedRows[0].role,
      });
      return insertedRows[0];
    }
  } catch (error) {
    console.error(`❌ Error insertando usuario:`, error);
  }

  // Intentar recuperar de nuevo por si se creó en otra transacción
  const fallback = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!fallback) {
    throw new Error(
      `No se pudo crear ni recuperar el usuario con email ${email}`
    );
  }

  console.log(`✅ Usuario recuperado después del fallback:`, {
    id: fallback.id,
    email: fallback.email,
    role: fallback.role,
  });

  return fallback;
}

export async function ensureTicketAssignment(ticketId: number, userId: string) {
  console.log(`🔗 [ensureTicketAssignment] Iniciando asignación...`);
  console.log(`   Ticket ID: ${ticketId}`);
  console.log(`   User ID: ${userId}`);

  try {
    // Verificar que el ticket existe
    const ticketExists = await db.query.tickets.findFirst({
      where: (t, { eq }) => eq(t.id, ticketId),
    });

    if (!ticketExists) {
      console.error(`❌ El ticket #${ticketId} no existe`);
      throw new Error(`Ticket #${ticketId} no encontrado`);
    }

    console.log(`✅ Ticket #${ticketId} existe`);

    // Verificar que el usuario existe
    const userExists = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!userExists) {
      console.error(`❌ El usuario ${userId} no existe`);
      throw new Error(`Usuario ${userId} no encontrado`);
    }

    console.log(`✅ Usuario ${userId} existe (email: ${userExists.email})`);

    // Verificar si la asignación ya existe
    const existingAssignment = await db.query.ticketAssignees.findFirst({
      where: (ta, { and, eq }) =>
        and(eq(ta.ticketId, ticketId), eq(ta.userId, userId)),
    });

    if (existingAssignment) {
      console.log(`ℹ️ La asignación ya existe (ID: ${existingAssignment.id})`);
      console.log(`   Ticket: #${ticketId}`);
      console.log(`   Usuario: ${userId} (${userExists.email})`);
      return existingAssignment;
    }

    // Intentar insertar la asignación
    console.log(`💾 Insertando en ticket_assignees...`);
    const result = await db
      .insert(ticketAssignees)
      .values({
        ticketId,
        userId,
        createdAt: new Date(),
      })
      .returning();

    if (result.length > 0) {
      console.log(`✅ ¡Asignación creada exitosamente!`);
      console.log(`   ID de asignación: ${result[0].id}`);
      console.log(`   Ticket: #${ticketId}`);
      console.log(`   Usuario: ${userId} (${userExists.email})`);
      return result[0];
    } else {
      console.log(`⚠️ No se pudo crear la asignación (sin error explícito)`);
      return null;
    }
  } catch (error) {
    console.error(
      `❌ ERROR CRÍTICO asignando ticket #${ticketId} a ${userId}:`
    );
    console.error(error);
    throw error;
  }
}
