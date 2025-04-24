import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import { sql } from 'drizzle-orm';
import { tickets, users, ticketComments } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	sendEmail,
	getNewTicketAssignmentEmail,
} from '~/lib/emails/ticketEmails';

// GET /api/admin/tickets
export async function GET(request: Request) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;
	const { searchParams } = new URL(request.url);
	const type = searchParams.get('type');

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		let whereClause = sql``;

		if (type === 'logs') {
			whereClause = sql`WHERE t.tipo = 'logs'`;
		} else if (type === 'assigned') {
			whereClause = sql`WHERE t.assigned_to_id = ${userId}`;
		}

		const query = sql`
			SELECT
				t.id,
				t.creator_id,
				t.assigned_to_id,
				t.email,
				t.description,
				t.comments,
				t.estado,
				t.tipo,
				t.cover_image_key,
				t.created_at,
				c.name AS creator_name,
				c.email AS creator_email,
				a.name AS assigned_to_name,
				a.email AS assigned_to_email
			FROM tickets t
			LEFT JOIN users c ON t.creator_id = c.id
			LEFT JOIN users a ON t.assigned_to_id = a.id
			${whereClause}
		`;

		const result = await db.execute(query);
		return NextResponse.json(result.rows ?? []);
	} catch (error) {
		console.error('❌ Error fetching tickets:', error);
		return NextResponse.json(
			{ error: 'Error fetching tickets' },
			{ status: 500 }
		);
	}
}

// POST /api/admin/tickets
export async function POST(request: Request) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		console.log('📝 Creando nuevo ticket:', body);

		const ticketData = {
			...body,
			creatorId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		if (!ticketData.assignedToId) {
			delete ticketData.assignedToId;
		}

		// Create the ticket first
		const newTicket = await db.insert(tickets).values(ticketData).returning();
		console.log('✅ Ticket creado:', newTicket[0]);

		// Try to send email if there's an assignee
		if (body.assignedToId) {
			console.log(
				'📧 Ticket asignado, buscando información del usuario:',
				body.assignedToId
			);

			try {
				const assignee = await db.query.users.findFirst({
					where: eq(users.id, body.assignedToId),
				});

				if (assignee?.email) {
					console.log(
						'📧 Enviando notificación al usuario asignado:',
						assignee.email
					);
					const emailResult = await sendEmail({
						to: assignee.email,
						subject: `Nuevo Ticket Asignado #${newTicket[0].id}`,
						html: getNewTicketAssignmentEmail(
							newTicket[0].id,
							body.description
						),
					});
					console.log('📧 Resultado del envío:', emailResult);
				} else {
					console.log('⚠️ Usuario asignado no tiene email configurado');
				}
			} catch (error) {
				console.error('❌ Error en el proceso de envío de email:', error);
			}

			// Add initial comment for assignment
			console.log('📝 Agregando comentario de asignación');
			await db.insert(ticketComments).values({
				ticketId: newTicket[0].id,
				userId,
				content: `Ticket creado y asignado`,
				createdAt: new Date(),
			});
			console.log('✅ Comentario de asignación agregado');
		} else {
			console.log('ℹ️ Ticket creado sin asignación');
		}

		return NextResponse.json(newTicket[0]);
	} catch (error) {
		console.error('❌ Error creating ticket:', error);
		return NextResponse.json(
			{ error: 'Error creating ticket' },
			{ status: 500 }
		);
	}
}

// PUT /api/admin/tickets
export async function PUT(request: Request) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id, ...updateData } = body;

		const updatedTicket = await db
			.update(tickets)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(eq(tickets.id, id))
			.returning();

		return NextResponse.json(updatedTicket[0]);
	} catch (error) {
		console.error('❌ Error updating ticket:', error);
		return NextResponse.json(
			{ error: 'Error updating ticket' },
			{ status: 500 }
		);
	}
}
