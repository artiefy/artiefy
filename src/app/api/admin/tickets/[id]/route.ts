import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import {
	sendTicketEmail,
	getTicketStatusChangeEmail,
} from '~/lib/emails/ticketEmails';
import { db } from '~/server/db';
import { tickets, ticketComments } from '~/server/db/schema';

// Tipos seguros
interface UpdateTicketBody {
	assignedToId?: string;
	newComment?: string;
	estado?: 'abierto' | 'en proceso' | 'en revision' | 'solucionado' | 'cerrado';
	description?: string;
	tipo?: 'otro' | 'bug' | 'revision' | 'logs';
	email?: string;
	coverImageKey?: string | null;
	videoKey?: string | null;
	documentKey?: string | null;
	comments?: string;
}

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata.role;

		if (!userId || (role !== 'admin' && role !== 'super-admin')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const ticketId = Number(params.id);
		if (isNaN(ticketId)) {
			return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
		}

		const body = (await request.json()) as UpdateTicketBody;

		const currentTicket = await db.query.tickets.findFirst({
			where: eq(tickets.id, ticketId),
			with: {
				creator: true,
			},
		});

		if (!currentTicket) {
			return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
		}

		if (body.newComment) {
			await db.insert(ticketComments).values({
				ticketId,
				userId,
				content: body.newComment,
				createdAt: new Date(),
			});
		}

		// ✅ CONSTRUCCIÓN SEGURA DE LOS CAMPOS PARA ACTUALIZAR
		const updateData: Partial<UpdateTicketBody> = {
			estado: body.estado,
			tipo: body.tipo,
			email: body.email,
			description: body.description,
			comments: body.comments,
			coverImageKey: body.coverImageKey ?? null,
			videoKey: body.videoKey ?? null,
			documentKey: body.documentKey ?? null,
		};

		if (body.assignedToId) {
			updateData.assignedToId = body.assignedToId;
		}

		const updatedTicket = await db
			.update(tickets)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(eq(tickets.id, ticketId))
			.returning();

		const comments = await db.query.ticketComments.findMany({
			where: eq(ticketComments.ticketId, ticketId),
			with: {
				user: true,
			},
			orderBy: (comments, { desc }) => [desc(comments.createdAt)],
		});

		if (currentTicket.creator?.email) {
			console.log('📧 Enviando notificación a:', currentTicket.creator.email);

			const commentHistory = comments
				.map(
					(c) =>
						`${c.user?.name ?? 'Usuario'}: ${c.content} (${new Date(c.createdAt).toLocaleString()})`
				)
				.join('\n');

			const emailResult = await sendTicketEmail({
				to: currentTicket.creator.email,
				subject: `Ticket #${ticketId} - Actualización`,
				html: getTicketStatusChangeEmail(
					ticketId,
					body.estado ?? currentTicket.estado,
					currentTicket.description,
					commentHistory,
					body.newComment ?? ''
				),
			});

			console.log('📧 Resultado del envío:', emailResult);
		}

		return NextResponse.json({ ...updatedTicket[0], comments });
	} catch (error) {
		console.error('❌ Error updating ticket:', error);
		return NextResponse.json(
			{ error: 'Error updating ticket' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata.role;

		if (!userId || (role !== 'admin' && role !== 'super-admin')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const ticketId = Number(params.id);
		if (isNaN(ticketId)) {
			return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
		}

		// ❗ Primero elimina los comentarios del ticket
		await db
			.delete(ticketComments)
			.where(eq(ticketComments.ticketId, ticketId));

		// ✅ Luego elimina el ticket
		const deletedTicket = await db
			.delete(tickets)
			.where(eq(tickets.id, ticketId))
			.returning();

		if (!deletedTicket.length) {
			return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
		}

		return NextResponse.json(deletedTicket[0]);
	} catch (error) {
		console.error('❌ Error deleting ticket:', error);
		return NextResponse.json(
			{ error: 'Error deleting ticket' },
			{ status: 500 }
		);
	}
}
