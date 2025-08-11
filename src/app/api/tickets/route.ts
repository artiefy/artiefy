import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  createTicket,
  deleteTicket,
  //getTickets,
  updateTicketState,
} from '~/models/educatorsModels/ticketsModels';

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// export async function GET(request: Request) {
// 	try {
// 		const url = new URL(request.url);
// 		const userId = url.searchParams.get('userId');

// 		if (!userId) {
// 			return NextResponse.json(
// 				{ error: 'ID de usuario inválido' },
// 				{ status: 400 }
// 			);
// 		}

// 		const allTickets = await getTickets();

// 		if (!allTickets) {
// 			return NextResponse.json(
// 				{ error: 'Tickets no encontrados para este usuario' },
// 				{ status: 404 }
// 			);
// 		}

// 		return NextResponse.json(allTickets);
// 	} catch (error) {
// 		console.error('Error al obtener los tickets:', error);
// 		return NextResponse.json(
// 			{ error: 'Error al obtener los tickets' },
// 			{ status: 500 }
// 		);
// 	}
// }

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await req.json()) as {
      comments: string;
      description: string;
      coverImageKey: string;
      email: string;
      userId: string;
    };

    const { comments, description, userId: bodyUserId, email } = body;

    await createTicket({ ...body, userId: bodyUserId, email });

    if (!comments || !description || !userId || !email) {
      console.log('Faltan campos obligatorios.');
    }

    return NextResponse.json(
      { message: 'Ticket creado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear el ticket:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(`Error al crear el ticket: ${errorMessage}`, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await req.json()) as {
      ticketId: number;
    };
    const { ticketId } = body;

    if (!ticketId) {
      return respondWithError('Se requiere el ID del ticket', 400);
    }

    await updateTicketState(Number(ticketId));

    return NextResponse.json({
      message: 'Estado del ticket actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar el estado del ticket:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al actualizar el estado del ticket: ${errorMessage}`,
      500
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return respondWithError('Se requiere el ID del ticket', 400);
    }

    await deleteTicket(Number(ticketId));
    return NextResponse.json({ message: 'Ticket eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el ticket:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al eliminar el ticket: ${errorMessage}`,
      500
    );
  }
}
