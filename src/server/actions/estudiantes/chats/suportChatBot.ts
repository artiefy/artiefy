'use server';

import { desc, eq, or } from 'drizzle-orm';

import {
  getNewTicketAssignmentEmail,
  sendTicketEmail,
} from '~/lib/emails/ticketEmails';
import { db } from '~/server/db';
import { ticketComments, tickets, users } from '~/server/db/schema';
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

// Función helper para obtener todos los super-admins
async function getAllSuperAdmins() {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, 'super-admin'));
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

// Función para asignar ticket a super-admins y enviar correos
async function assignTicketToSuperAdmins(
  ticketId: number,
  description: string
) {
  try {
    // Obtener todos los super-admins
    const superAdmins = await getAllSuperAdmins();

    console.log('🔔 Super-admins encontrados:', superAdmins.length);
    console.log(
      '📋 Lista de super-admins:',
      superAdmins.map((admin) => ({ id: admin.id, email: admin.email }))
    );

    // Obtener asignaciones adicionales por correo
    const extraAssignees = await Promise.all(
      SUPPORT_AUTO_ASSIGN_EMAILS.map(async (email) =>
        getOrCreateUserByEmail(email, 'super-admin')
      )
    );

    const combinedAssignees = [...superAdmins, ...extraAssignees];

    const assigneesMap = new Map<
      string,
      { id: string; email: string | null }
    >();
    for (const assignee of combinedAssignees) {
      if (!assigneesMap.has(assignee.id)) {
        assigneesMap.set(assignee.id, {
          id: assignee.id,
          email: assignee.email ?? null,
        });
      }
    }

    if (assigneesMap.size === 0) {
      console.warn('⚠️ No se encontraron super-admins para asignar');
    }

    await Promise.all(
      Array.from(assigneesMap.values()).map(async (admin) => {
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

    const emailRecipients = new Set<string>();

    for (const admin of assigneesMap.values()) {
      if (admin.email) {
        emailRecipients.add(admin.email);
      }
    }

    SUPPORT_AUTO_ASSIGN_EMAILS.forEach((email) => emailRecipients.add(email));

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
  sender: string,
  userEmail?: string
) {
  console.log('💬 SaveTicketMessage llamado:', {
    userId,
    sender,
    userEmail: userEmail ?? 'sin email',
    contentLength: content.length,
  });

  try {
    const ticket = await getOrCreateSuportChat({
      creatorId: userId,
      email: userEmail ?? '', // Usar el email del usuario si está disponible
      description: content, // Usar el primer mensaje como descripción inicial
    });

    if (ticket.id === undefined) {
      console.error('❌ No se pudo obtener el ID del ticket');
      throw new Error(
        'No se pudo obtener el ID del ticket para guardar el comentario.'
      );
    }

    console.log('💾 Guardando comentario en ticket:', ticket.id);

    await db.insert(ticketComments).values({
      ticketId: ticket.id,
      userId: userId,
      content: content,
      sender: sender,
      createdAt: new Date(),
    });

    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, ticket.id));

    console.log('✅ Comentario guardado exitosamente');
  } catch (error) {
    console.error('❌ Error en SaveTicketMessage:', error);
    throw error;
  }
}
