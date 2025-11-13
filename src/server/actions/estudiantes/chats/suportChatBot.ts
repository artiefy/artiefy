'use server';

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

const FALLBACK_EMAIL_DOMAIN = 'artiefy.local';
const TICKET_REUSE_WINDOW_MS = 1000 * 60 * 30; // 30 minutos

export async function getTicketByUser(userId: string): Promise<{
  ticket: typeof tickets.$inferSelect | undefined;
  mensajes: (typeof ticketComments.$inferSelect)[];
}> {
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
  userId: string
): Promise<(typeof tickets.$inferSelect & { unreadCount: number })[]> {
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
  userId: string
): Promise<typeof tickets.$inferSelect | undefined> {
  const list = await getTicketsByUser(userId);
  const open = list.find(
    (t) =>
      (t.estado ?? '').toLowerCase() !== 'cerrado' &&
      (t.estado ?? '').toLowerCase() !== 'solucionado'
  );
  return open;
}

// Función para crear un ticket completamente nuevo (sin reutilizar)
export async function createNewTicket({
  creatorId,
  email,
  description,
}: {
  description?: string;
  creatorId: string;
  email?: string;
}) {
  console.log('🆕 Creando ticket completamente nuevo para usuario:', creatorId);

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

    console.log('✅ Nuevo ticket creado exitosamente:', {
      id: created.id,
      email: created.email,
      description: created.description,
    });

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
    console.error('❌ Error al crear nuevo ticket:', error);
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
      console.log('👤 Usuario creado automáticamente en la tabla users:', {
        id: inserted.id,
        email: inserted.email,
        role: inserted.role,
      });
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
    console.error('❌ Error creando usuario local para ticket:', error);
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
    console.log(
      `📧 Iniciando asignación automática para ticket #${ticketId}...`
    );

    // Solo obtener usuarios de los emails configurados en SUPPORT_AUTO_ASSIGN_EMAILS
    console.log(
      '📧 Obteniendo usuarios de correos auto-asignados:',
      SUPPORT_AUTO_ASSIGN_EMAILS
    );

    const assignees = await Promise.all(
      SUPPORT_AUTO_ASSIGN_EMAILS.map(async (email) =>
        getOrCreateUserByEmail(email, 'admin')
      )
    );

    console.log(
      '✅ Usuarios para asignación automática:',
      assignees.map((u) => ({ id: u.id, email: u.email, role: u.role }))
    );

    if (assignees.length === 0) {
      console.warn(
        '⚠️ No se encontraron usuarios para asignar automáticamente'
      );
      return;
    }

    // Asignar el ticket a cada usuario
    await Promise.all(
      assignees.map(async (admin) => {
        try {
          await ensureTicketAssignment(ticketId, admin.id);
          console.log(`✅ Ticket asignado a: ${admin.email ?? admin.id}`);
        } catch (error) {
          console.error(
            `❌ Error asignando ticket a ${admin.email ?? admin.id}:`,
            error
          );
        }
      })
    );

    // Enviar emails solo a los usuarios asignados
    const emailRecipients = new Set<string>();

    for (const admin of assignees) {
      if (admin.email) {
        emailRecipients.add(admin.email);
      }
    }

    console.log(
      `📨 Enviando emails de notificación a ${emailRecipients.size} destinatarios`
    );

    await Promise.all(
      Array.from(emailRecipients).map(async (email) => {
        try {
          await sendTicketEmail({
            to: email,
            subject: `🎫 Nuevo Ticket de Soporte #${ticketId}`,
            html: getNewTicketAssignmentEmail(ticketId, description),
          });
          console.log(`✅ Email de ticket enviado a: ${email}`);
        } catch (error) {
          console.error(`❌ Error enviando email a ${email}:`, error);
        }
      })
    );

    console.log('✅ Proceso de asignación completado');
  } catch (error) {
    console.error('❌ Error en assignTicketToSuperAdmins:', error);
    // No lanzar el error para que el ticket se cree aunque falle la asignación
  }
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
  console.log('🔍 Buscando ticket existente para usuario:', creatorId);

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
    console.log('✅ Ticket existente encontrado:', existing.id);
    // Si ya hay un ticket, obtenerlo con los mensajes
    const ticketWithMessages = await getTicketWithMessages(existing.id);
    return {
      ...ticketWithMessages.ticket,
      messages: ticketWithMessages.messages,
      continuationOfTicket: null,
    };
  }

  console.log('📝 Creando nuevo ticket desde chatbot...');
  console.log('📋 Datos del ticket:', {
    creatorId,
    email: email ?? 'sin email',
    description: description ?? 'Ticket de soporte desde chatbot',
  });

  try {
    await ensureUserExists(creatorId, email);

    let previousTicketData: Awaited<
      ReturnType<typeof getTicketWithMessages>
    > | null = null;

    if (existing && !reuseExisting) {
      console.log(
        '♻️ Ticket existente demasiado antiguo o cerrado. Se creará uno nuevo.'
      );
      previousTicketData = await getTicketWithMessages(existing.id);
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

    console.log('✅ Ticket creado exitosamente:', {
      id: created.id,
      email: created.email,
      description: created.description,
    });

    // Asignar a super-admins y enviar notificaciones
    console.log('📧 Iniciando asignación a super-admins...');
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
    console.error('❌ Error al crear ticket:', error);
    throw error;
  }
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

  // Siempre buscar primero por ticket_id si está disponible
  if (ticket_id !== null) {
    ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticket_id))
      .limit(1)
      .then((rows) => rows[0]);
  }
  // Solo si no hay ticket_id, buscar por user_id
  else if (user_id) {
    ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.creatorId, user_id))
      .orderBy(desc(tickets.createdAt))
      .limit(1)
      .then((rows) => rows[0]);
  }

  // Obtener mensajes solo si encontramos el ticket y coincide con el ticket_id solicitado
  if (ticket && (!ticket_id || ticket.id === ticket_id)) {
    console.log('Ticket found:', ticket);
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
  userId: string,
  content: string,
  sender: string,
  userEmail?: string,
  ticketId?: number
) {
  console.log('💬 SaveTicketMessage llamado:', {
    userId,
    sender,
    userEmail: userEmail ?? 'sin email',
    ticketId: ticketId ?? 'sin ticketId específico',
    contentLength: content.length,
  });

  try {
    let targetTicket: typeof tickets.$inferSelect;
    if (ticketId) {
      const existingTicket = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.id, ticketId), eq(tickets.creatorId, userId)))
        .limit(1)
        .then((rows) => rows[0]);
      if (!existingTicket) {
        console.error('❌ Ticket no encontrado o no pertenece al usuario');
        throw new Error('Ticket no válido');
      }
      targetTicket = existingTicket;
    } else {
      const createdOrExisting = await getOrCreateSuportChat({
        creatorId: userId,
        email: userEmail ?? '',
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
                      console.log(`✅ Email enviado a admin ${adminEmail}`);
                    } else {
                      console.error('❌ Error email admin', res.error);
                    }
                  });
                })
            );
          } else {
            console.log('⚠️ Sin admins asignados para notificar');
          }
        }
      } catch (err) {
        console.error('❌ Error notificando admins:', err);
      }
    }

    // Retornar información para que el cliente pueda mostrar mensaje automático y timestamp universal
    return {
      ticketId: targetTicket.id,
      createdAt: insertedComment[0]?.createdAt ?? new Date(),
      sender,
    };
  } catch (error) {
    console.error('❌ Error en SaveTicketMessage:', error);
    throw error;
  }
}
