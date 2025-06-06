import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { db } from '~/server/db';
import { tickets } from '~/server/db/schema';

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
    return NextResponse.json(newTicket as StudentTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Error creating ticket' },
      { status: 500 }
    );
  }
}
