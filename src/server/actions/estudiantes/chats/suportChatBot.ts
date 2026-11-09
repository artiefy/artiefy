'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, count, desc, eq, or } from 'drizzle-orm';

import {
  getNewTicketAssignmentEmail,
  getTicketHistoryEmail,
  sendTicketEmail,
} from '~/lib/emails/ticketEmails';
import { formatDateColombia } from '~/lib/formatDate';
import { db } from '~/server/db';
import {
  ticketAssignees,
  ticketComments,
  tickets,
  users,
} from '~/server/db/schema';
import {
  ensureTicketAssignment,
  getOrCreateUserByEmail,
  SUPPORT_AUTO_ASSIGN_EMAILS,
} from '~/server/helpers/supportTicketAssignments';
import { getApiSession } from '~/server/utils/apiAuth';

const FALLBACK_EMAIL_DOMAIN = 'artiefy.local';
const TICKET_REUSE_WINDOW_MS = 1000 * 60 * 30; // 30 minutos

// Canned replies the student UI persists as "support" messages after a menu
// choice. A student may only author a support-side message with exactly these
// texts; anything else is stored as the student's own message.
const STUDENT_CANNED_SUPPORT_REPLIES: ReadonlySet<string> = new Set([
  'Por favor, describe el error que encontraste. Incluye todos los detalles posibles como qué estabas haciendo cuando ocurrió el problema.',
  '¡Perfecto! Hazme tu pregunta y te ayudaré con la información que necesites sobre Artiefy.',
  'Entiendo que tienes un problema técnico. Describe detalladamente qué está pasando y qué dispositivo/navegador estás usando.',
  'Te ayudo con tu consulta de pagos. ¿Tienes algún problema con una transacción, facturación o necesitas información sobre los planes?',
]);

// Every exported function here is a public server action: the caller is always
// resolved from the session and client-supplied user ids are ignored.
async function requireSession() {
  const session = await getApiSession();
  if (!session.userId) throw new Error('No autorizado');
  return { userId: session.userId, isStaff: session.isStaff };
}

async function sessionEmail(fallback?: string) {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? fallback;
}

export async function getTicketByUser(_userId?: string): Promise<{
  ticket: typeof tickets.$inferSelect | undefined;
  mensajes: (typeof ticketComments.$inferSelect)[];
}> {
  const session = await getApiSession();
  if (!session.userId) return { ticket: undefined, mensajes: [] };
  const userId = session.userId;
  // Buscar el ticket creado por el usuario (solo uno)
  const ticket = await db
    .select()
    .from(tickets)
    .where(eq(tickets.creatorId, userId))
    .orderBy(desc(tickets.createdAt))
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

// Lista todos los tickets del usuario, más recientes primero
export async function getTicketsByUser(
  _userId?: string
): Promise<(typeof tickets.$inferSelect & { unreadCount: number })[]> {
  const session = await getApiSession();
  if (!session.userId) return [];
  const userId = session.userId;
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.creatorId, userId))
    .orderBy(desc(tickets.updatedAt), desc(tickets.createdAt));

  // Obtener conteo de mensajes no leídos por ticket (mensajes de soporte Y admin)
  const unreadRows = (await db
    .select({ ticketId: ticketComments.ticketId, unread: count() })
    .from(ticketComments)
    .where(
      and(
        eq(ticketComments.isRead, false),
        // Contar mensajes de admin O support (no del usuario)
        or(
          eq(ticketComments.sender, 'admin'),
          eq(ticketComments.sender, 'support')
        )
      )
    )
    .groupBy(ticketComments.ticketId)) as {
    ticketId: number;
    unread: number;
  }[];

  const unreadMap = new Map<number, number>();
  for (const r of unreadRows) {
    unreadMap.set(Number(r.ticketId), Number(r.unread ?? 0));
  }

  // Anexar unreadCount a cada ticket (como property adicional)
  return rows.map((t) => ({ ...t, unreadCount: unreadMap.get(t.id) ?? 0 }));
}

// Devuelve el ticket abierto más reciente (si existe)
export async function getUserOpenTicket(
  _userId?: string
): Promise<typeof tickets.$inferSelect | undefined> {
  const list = await getTicketsByUser();
  const open = list.find(
    (t) =>
      (t.estado ?? '').toLowerCase() !== 'cerrado' &&
      (t.estado ?? '').toLowerCase() !== 'solucionado'
  );
  return open;
}

// Función para crear un ticket completamente nuevo (sin reutilizar)
export async function createNewTicket({
  email: clientEmail,
  description,
}: {
  description?: string;
  /** @deprecated Ignored: the creator is always the signed-in user. */
  creatorId?: string;
  email?: string;
}) {
  const { userId: creatorId } = await requireSession();
  const email = await sessionEmail(clientEmail);

  try {
    await ensureUserExists(creatorId, email);

    const normalizedDescription =
      description?.trim() && description.trim() !== ''
        ? description.trim()
        : 'Nuevo ticket de soporte';

    const [created] = await db
      .insert(tickets)
      .values({
        creatorId: creatorId,
        description: normalizedDescription,
        estado: 'abierto',
        tipo: 'bug',
        email: email ?? '',
        title: normalizedDescription.slice(0, 50) || 'Ticket de Soporte',
        comments: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Asignar a super-admins y enviar notificaciones
    await assignTicketToSuperAdmins(
      created.id,
      created.description ?? 'Sin descripción'
    );

    return {
      ...created,
      messages: [], // Siempre empezar con mensajes vacíos
    };
  } catch (error) {
    throw error;
  }
}

// Garantiza que el usuario exista en la tabla local antes de crear tickets
async function ensureUserExists(creatorId: string, email?: string) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, creatorId),
  });

  if (existingUser) return existingUser;

  const sanitizedEmail =
    email?.trim() && email.trim() !== ''
      ? email.trim()
      : `${creatorId.replace(/[^a-zA-Z0-9]/g, '')}@${FALLBACK_EMAIL_DOMAIN}`;

  try {
    const insertedRows = await db
      .insert(users)
      .values({
        id: creatorId,
        role: 'estudiante',
        email: sanitizedEmail,
        name: null,
      })
      .onConflictDoNothing({ target: users.id })
      .returning();

    if (insertedRows.length > 0) {
      const inserted = insertedRows[0];
      return inserted;
    }

    const fallbackUser = await db.query.users.findFirst({
      where: eq(users.id, creatorId),
    });

    if (!fallbackUser) {
      throw new Error('No se pudo crear ni recuperar el usuario asociado');
    }

    return fallbackUser;
  } catch (error) {
    throw error;
  }
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function shouldCreateNewTicket(existing: typeof tickets.$inferSelect) {
  const status = existing.estado ?? '';
  if (['cerrado', 'solucionado'].includes(status)) {
    return true;
  }

  const lastUpdated =
    toDate(existing.updatedAt) ?? toDate(existing.createdAt) ?? null;

  if (!lastUpdated) {
    return true;
  }

  const ageMs = Date.now() - lastUpdated.getTime();
  return ageMs > TICKET_REUSE_WINDOW_MS;
}

// Función para asignar ticket a admins y enviar correos
async function assignTicketToSuperAdmins(
  ticketId: number,
  description: string
) {
  try {
    // Solo obtener usuarios de los emails configurados en SUPPORT_AUTO_ASSIGN_EMAILS

    const assignees = await Promise.all(
      SUPPORT_AUTO_ASSIGN_EMAILS.map(async (email) =>
        getOrCreateUserByEmail(email, 'admin')
      )
    );

    if (assignees.length === 0) {
      return;
    }

    // Asignar el ticket a cada usuario
    await Promise.all(
      assignees.map(async (admin) => {
        try {
          await ensureTicketAssignment(ticketId, admin.id);
        } catch (error) {}
      })
    );

    // Enviar emails solo a los usuarios asignados
    const emailRecipients = new Set<string>();

    for (const admin of assignees) {
      if (admin.email) {
        emailRecipients.add(admin.email);
      }
    }

    await Promise.all(
      Array.from(emailRecipients).map(async (email) => {
        try {
          await sendTicketEmail({
            to: email,
            subject: `🎫 Nuevo Ticket de Soporte #${ticketId}`,
            html: getNewTicketAssignmentEmail(ticketId, description),
          });
        } catch (error) {}
      })
    );
  } catch (error) {
    // No lanzar el error para que el ticket se cree aunque falle la asignación
  }
}

export async function getOrCreateSuportChat({
  email: clientEmail,
  description,
}: {
  description?: string;
  /** @deprecated Ignored: the creator is always the signed-in user. */
  creatorId?: string;
  email?: string;
}) {
  const { userId: creatorId } = await requireSession();
  const email = await sessionEmail(clientEmail);
  return getOrCreateSuportChatFor({ creatorId, email, description });
}

async function getOrCreateSuportChatFor({
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
    .orderBy(desc(tickets.createdAt))
    .limit(1)
    .then((rows) => rows[0]);

  const reuseExisting = existing && shouldCreateNewTicket(existing) === false;

  if (reuseExisting && existing) {
    // Si ya hay un ticket, obtenerlo con los mensajes
    const ticketWithMessages = await loadTicketWithMessages(existing.id);
    return {
      ...ticketWithMessages.ticket,
      messages: ticketWithMessages.messages,
      continuationOfTicket: null,
    };
  }

  try {
    await ensureUserExists(creatorId, email);

    let previousTicketData: Awaited<
      ReturnType<typeof loadTicketWithMessages>
    > | null = null;

    if (existing && !reuseExisting) {
      previousTicketData = await loadTicketWithMessages(existing.id);
    }

    // Si no existe, crearlo
    const normalizedDescription =
      description?.trim() && description.trim() !== ''
        ? description.trim()
        : 'Ticket de soporte desde chatbot';

    const [created] = await db
      .insert(tickets)
      .values({
        creatorId: creatorId,
        description: normalizedDescription,
        estado: 'abierto',
        tipo: 'bug',
        email: email ?? '',
        title: normalizedDescription.slice(0, 50) || 'Ticket de Soporte',
        comments: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Asignar a super-admins y enviar notificaciones
    await assignTicketToSuperAdmins(
      created.id,
      created.description ?? 'Sin descripción'
    );

    return {
      ...created,
      messages: previousTicketData?.messages ?? [],
      continuationOfTicket: previousTicketData?.ticket ?? null,
    };
  } catch (error) {
    throw error;
  }
}

export async function getTicketWithMessages(
  ticket_id: number,
  _user_id?: string
): Promise<{
  ticket: typeof tickets.$inferSelect | undefined;
  messages: (typeof ticketComments.$inferSelect)[];
}> {
  const session = await getApiSession();
  if (!session.userId) return { ticket: undefined, messages: [] };

  const result = await loadTicketWithMessages(ticket_id);
  // Students only see their own tickets; staff may open any ticket.
  if (
    result.ticket &&
    result.ticket.creatorId !== session.userId &&
    !session.isStaff
  ) {
    return { ticket: undefined, messages: [] };
  }
  return result;
}

async function loadTicketWithMessages(ticket_id: number): Promise<{
  ticket: typeof tickets.$inferSelect | undefined;
  messages: (typeof ticketComments.$inferSelect)[];
}> {
  let ticket: typeof tickets.$inferSelect | undefined = undefined;
  let msgs: (typeof ticketComments.$inferSelect)[] = [];

  // Siempre buscar primero por ticket_id si está disponible
  if (ticket_id !== null) {
    ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticket_id))
      .limit(1)
      .then((rows) => rows[0]);
  }

  // Obtener mensajes solo si encontramos el ticket y coincide con el ticket_id solicitado
  if (ticket && (!ticket_id || ticket.id === ticket_id)) {
    msgs = await db
      .select()
      .from(ticketComments)
      .where(eq(ticketComments.ticketId, ticket.id))
      .orderBy(ticketComments.id);
  }
  return {
    ticket,
    messages: msgs,
  };
}

export async function SaveTicketMessage(
  _userId: string,
  content: string,
  requestedSender: string,
  userEmail?: string,
  ticketId?: number
) {
  const { userId, isStaff } = await requireSession();

  // The author side is derived on the server, never trusted from the client.
  // Staff replying to a ticket write as support; students write as the user,
  // except for the fixed canned support replies the student UI persists.
  const replyingAsStaff = isStaff && Boolean(ticketId);
  const sender = replyingAsStaff
    ? 'support'
    : requestedSender === 'support' &&
        STUDENT_CANNED_SUPPORT_REPLIES.has(content)
      ? 'support'
      : 'user';

  try {
    let targetTicket: typeof tickets.$inferSelect;
    if (ticketId) {
      const existingTicket = await db
        .select()
        .from(tickets)
        .where(
          replyingAsStaff
            ? eq(tickets.id, ticketId)
            : and(eq(tickets.id, ticketId), eq(tickets.creatorId, userId))
        )
        .limit(1)
        .then((rows) => rows[0]);
      if (!existingTicket) {
        throw new Error('Ticket no válido');
      }
      targetTicket = existingTicket;
    } else {
      const createdOrExisting = await getOrCreateSuportChatFor({
        creatorId: userId,
        email: (await sessionEmail(userEmail)) ?? '',
        description: content,
      });
      targetTicket = {
        id: createdOrExisting.id,
        creatorId: createdOrExisting.creatorId,
        description: createdOrExisting.description,
        estado: createdOrExisting.estado,
        tipo: createdOrExisting.tipo,
        email: createdOrExisting.email,
        title: createdOrExisting.title,
        comments: createdOrExisting.comments,
        createdAt: createdOrExisting.createdAt,
        updatedAt: createdOrExisting.updatedAt,
      } as typeof tickets.$inferSelect;
    }

    if (targetTicket.id == null) {
      throw new Error('ID de ticket inválido');
    }

    const insertedComment = await db
      .insert(ticketComments)
      .values({
        ticketId: targetTicket.id,
        userId,
        content,
        sender,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();

    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, targetTicket.id));

    // Notificar admins asignados si el remitente es el usuario. También retornaremos info adicional.
    if (sender === 'user') {
      try {
        const ticketData = await db.query.tickets.findFirst({
          where: eq(tickets.id, targetTicket.id),
        });
        if (ticketData) {
          const assignments = await db.query.ticketAssignees.findMany({
            where: eq(ticketAssignees.ticketId, targetTicket.id),
            with: { user: true },
          });
          if (assignments.length) {
            const allComments = await db.query.ticketComments.findMany({
              where: eq(ticketComments.ticketId, targetTicket.id),
              with: { user: true },
              orderBy: (comments, { asc }) => [asc(comments.createdAt)],
            });
            // Filtrar mensaje automático de asignación: "Ticket asignado a X usuario(s)."
            const assignmentNoteRegex =
              /^Ticket asignado a \d+ usuario\(s\)\.$/;
            const commentsForEmail = allComments
              .filter((c) => !assignmentNoteRegex.test(c.content))
              .map((c) => ({
                content: c.content,
                sender: c.sender,
                senderName: c.user?.name ?? 'Usuario',
                createdAt: formatDateColombia(c.createdAt),
              }));
            void Promise.all(
              assignments
                .filter((a) => a.user?.email)
                .map((a) => {
                  const adminEmail = a.user!.email!;
                  const html = getTicketHistoryEmail(
                    targetTicket.id,
                    'admin',
                    ticketData.description,
                    ticketData.estado,
                    commentsForEmail
                  );
                  return sendTicketEmail({
                    to: adminEmail,
                    subject: `💬 Nuevo mensaje del estudiante en Ticket #${targetTicket.id}`,
                    html,
                  }).then((res) => {
                    if (res.success) {
                    } else {
                    }
                  });
                })
            );
          } else {
          }
        }
      } catch (err) {}
    }

    // Retornar información para que el cliente pueda mostrar mensaje automático y timestamp universal
    return {
      ticketId: targetTicket.id,
      createdAt: insertedComment[0]?.createdAt ?? new Date(),
      sender,
    };
  } catch (error) {
    throw error;
  }
}
