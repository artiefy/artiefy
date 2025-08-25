'use server';

import { eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { ticketComments, tickets } from '~/server/db/schema';

export async function getTicketByUser(userId: string): Promise<{
  ticket: typeof tickets.$inferSelect | undefined;
  mensajes: (typeof ticketComments.$inferSelect)[];
}> {
  // Buscar el ticket creado por el usuario (solo uno)
  const ticket = await db
    .select()
    .from(tickets)
    .where(eq(tickets.creatorId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  // Si hay ticket, buscar comentarios asociados a ese usuario
  const mensajes = ticket
    ? await db
        .select()
        .from(ticketComments)
        .where(eq(ticketComments.ticketId, ticket.id))
    : [];

  return {
    ticket,
    mensajes,
  };
}

export async function getOrCreateSuportChat({
  creatorId,
  email,
  description,
}: {
  description?: string;
  creatorId: string;
  email?: string;
}) {
  // Verificar si ya existe un ticket para el usuario
  const existing = await db
    .select()
    .from(tickets)
    .where(eq(tickets.creatorId, creatorId))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    // Si ya hay un ticket, obtenerlo con los mensajes
    const ticketWithMessages = await getTicketWithMessages(existing.id);
    return {
      ...ticketWithMessages.ticket,
      messages: ticketWithMessages.messages,
    };
  }

  // Si no existe, crearlo
  const [created] = await db
    .insert(tickets)
    .values({
      creatorId: creatorId,
      description: description ?? '',
      estado: 'abierto',
      tipo: 'bug',
      email: email ?? '',
      title: 'Ticket de soporte',
    })
    .returning();

  return {
    ...created,
    messages: [], // nuevo ticket → sin mensajes
  };
}

export async function getTicketWithMessages(
  ticket_id: number,
  user_id?: string
): Promise<{
  ticket: typeof tickets.$inferSelect | undefined;
  messages: (typeof ticketComments.$inferSelect)[];
}> {
  console.log('Fetching ticket with ID:', ticket_id);

  let ticket: typeof tickets.$inferSelect | undefined = undefined;
  let msgs: (typeof ticketComments.$inferSelect)[] = [];
  const conditions = [];

  if (ticket_id !== null) {
    conditions.push(eq(tickets.id, ticket_id));
  }

  if (user_id !== undefined && user_id !== null) {
    conditions.push(eq(tickets.creatorId, user_id));
  }

  const whereClause =
    conditions.length === 1 ? conditions[0] : or(...conditions);
  if (ticket_id !== null || user_id !== null) {
    ticket = await db
      .select()
      .from(tickets)
      .where(whereClause)
      .limit(1)
      .then((rows) => rows[0]);

    if (ticket) {
      console.log('Ticket found:', ticket);
      msgs = await db
        .select()
        .from(ticketComments)
        .where(eq(ticketComments.ticketId, ticket.id))
        .orderBy(ticketComments.id);
    }
  }
  return {
    ticket,
    messages: msgs,
  };
}

export async function SaveTicketMessage(
  userId: string,
  content: string,
  sender: string
) {
  const ticket = await getOrCreateSuportChat({
    creatorId: userId,
    email: '', // Puedes pasar el email si lo tienes
    description: '',
  });

  if (ticket.id === undefined) {
    throw new Error(
      'No se pudo obtener el ID del ticket para guardar el comentario.'
    );
  }
  await db.insert(ticketComments).values({
    ticketId: ticket.id,
    userId: userId,
    content: content,
    sender: sender,
  });
}
