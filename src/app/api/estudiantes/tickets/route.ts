import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  getNewTicketAssignmentEmail,
  sendTicketEmail,
} from '~/lib/emails/ticketEmails';
import { db } from '~/server/db';
import { ticketAssignees, tickets } from '~/server/db/schema';

import type {
  CreateStudentTicketDTO,
  StudentTicket,
} from '~/types/studentTickets';

type ApiResponse<T> = NextResponse<T | { error: string }>;

export async function POST(
  request: Request
): Promise<ApiResponse<StudentTicket>> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateStudentTicketDTO;

    if (!body.email || !body.description || !body.tipo || !body.estado) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const ticketData = {
      email: body.email,
      description: body.description,
      tipo: body.tipo,
      estado: body.estado,
      comments: '',
      creatorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      coverImageKey: null,
      videoKey: null,
      documentKey: null,
    } as const;

    const [newTicket] = await db.insert(tickets).values(ticketData).returning();

    // --- ASIGNACIÓN AUTOMÁTICA PARA ESTUDIANTES ---
    // Buscar los usuarios con los emails indicados y asignarles el ticket
    const autoAssignEmails = [
      'gotopoluis19@gmail.com',
      'cordinacionacademica@ciadet.co',
    ];
    const autoAssignees = await db.query.users.findMany({
      where: (user, { or, eq }) =>
        or(
          eq(user.email, autoAssignEmails[0]),
          eq(user.email, autoAssignEmails[1])
        ),
    });

    if (autoAssignees.length > 0) {
      await Promise.all(
        autoAssignees.map(async (assignee) => {
          await db.insert(ticketAssignees).values({
            ticketId: newTicket.id,
            userId: assignee.id,
          });
          // Enviar correo de notificación a cada asignado
          if (assignee.email) {
            try {
              await sendTicketEmail({
                to: assignee.email,
                subject: `Nuevo Ticket Asignado #${newTicket.id}`,
                html: getNewTicketAssignmentEmail(
                  newTicket.id,
                  body.description
                ),
              });
            } catch (error) {
              // No lanzar error, solo loguear

              console.error('Error enviando email de ticket:', error);
            }
          }
        })
      );
    }
    // --- FIN ASIGNACIÓN AUTOMÁTICA ---

    return NextResponse.json(newTicket as StudentTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Error creating ticket' },
      { status: 500 }
    );
  }
}
