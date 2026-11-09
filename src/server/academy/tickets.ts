import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academies,
  ACADEMY_TICKET_ESTADOS,
  ACADEMY_TICKET_TIPOS,
  academyTicketComments,
  academyTickets,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Tickets de las academias hacia el soporte de Artiefy. Cada academia ve y
// comenta los suyos; el super-admin de Artiefy ve los de todas, los comenta y
// les cambia el estado.

export type EstadoTicket = (typeof ACADEMY_TICKET_ESTADOS)[number];
export type TipoTicket = (typeof ACADEMY_TICKET_TIPOS)[number];

export const esEstadoTicket = (v: unknown): v is EstadoTicket =>
  ACADEMY_TICKET_ESTADOS.includes(v as EstadoTicket);

/** Tickets de una academia, o de todas (academyId null, para Artiefy). */
export async function listarTickets(academyId: number | null) {
  return withRetry(() =>
    db
      .select({
        id: academyTickets.id,
        academyId: academyTickets.academyId,
        academia: academies.nombre,
        slug: academies.slug,
        email: academyTickets.email,
        title: academyTickets.title,
        description: academyTickets.description,
        tipo: academyTickets.tipo,
        estado: academyTickets.estado,
        createdAt: academyTickets.createdAt,
        updatedAt: academyTickets.updatedAt,
      })
      .from(academyTickets)
      .innerJoin(academies, eq(academies.id, academyTickets.academyId))
      .where(
        academyId == null ? undefined : eq(academyTickets.academyId, academyId)
      )
      .orderBy(desc(academyTickets.updatedAt))
  );
}

export async function crearTicket(
  academyId: number,
  autor: { userId: string; email: string },
  body: Record<string, unknown>
) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  if (!title || title.length > 120) {
    throw new ErrorAcademia('El asunto es obligatorio (máx. 120 caracteres).');
  }
  if (!description) throw new ErrorAcademia('Describe el problema.');
  const tipo = ACADEMY_TICKET_TIPOS.includes(body.tipo as TipoTicket)
    ? (body.tipo as TipoTicket)
    : 'soporte';
  const [nuevo] = await db
    .insert(academyTickets)
    .values({
      academyId,
      creatorId: autor.userId,
      email: autor.email,
      title,
      description,
      tipo,
    })
    .returning({ id: academyTickets.id });
  return nuevo!;
}

/** Ticket por id; con academyId, solo si es de esa academia. */
export async function ticketDe(id: number, academyId?: number) {
  const [fila] = await db
    .select({ id: academyTickets.id, academyId: academyTickets.academyId })
    .from(academyTickets)
    .where(
      academyId == null
        ? eq(academyTickets.id, id)
        : and(
            eq(academyTickets.id, id),
            eq(academyTickets.academyId, academyId)
          )
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Ticket no encontrado', 404);
  return fila;
}

export async function comentariosDe(ticketId: number) {
  return withRetry(() =>
    db
      .select()
      .from(academyTicketComments)
      .where(eq(academyTicketComments.ticketId, ticketId))
      .orderBy(asc(academyTicketComments.createdAt))
  );
}

export async function comentar(
  ticketId: number,
  userId: string,
  sender: 'academia' | 'artiefy',
  content: unknown
) {
  const texto = typeof content === 'string' ? content.trim() : '';
  if (!texto) throw new ErrorAcademia('Escribe un mensaje.');
  await db
    .insert(academyTicketComments)
    .values({ ticketId, userId, sender, content: texto });
  await db
    .update(academyTickets)
    .set({ updatedAt: new Date() })
    .where(eq(academyTickets.id, ticketId));
}

export async function cambiarEstadoTicket(ticketId: number, estado: unknown) {
  if (!esEstadoTicket(estado)) throw new ErrorAcademia('Estado inválido.');
  await db
    .update(academyTickets)
    .set({ estado, updatedAt: new Date() })
    .where(eq(academyTickets.id, ticketId));
}
