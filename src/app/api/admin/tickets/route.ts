import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { sql, eq } from 'drizzle-orm';

import {
	sendTicketEmail,
	getNewTicketAssignmentEmail,
} from '~/lib/emails/ticketEmails';
import { db } from '~/server/db';
import { tickets, users, ticketComments } from '~/server/db/schema';

interface CreateTicketBody {
	email: string;
	tipo: 'otro' | 'bug' | 'revision' | 'logs';
	description: string;
	comments: string;
	estado: 'abierto' | 'en proceso' | 'en revision' | 'solucionado' | 'cerrado';
	assignedToId?: string;
	coverImageKey?: string | null;
	videoKey?: string | null;
	documentKey?: string | null;
}

interface UpdateTicketBody extends Partial<CreateTicketBody> {
	id: number;
}

export const dynamic = 'force-dynamic';

// ========================
// GET /api/admin/tickets
// ========================

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
				t.updated_at,
				c.name AS creator_name,
				c.email AS creator_email,
				a.name AS assigned_to_name,
				t.video_key,
t.document_key,
				a.email AS assigned_to_email
			FROM tickets t
			LEFT JOIN users c ON t.creator_id = c.id
			LEFT JOIN users a ON t.assigned_to_id = a.id
			${whereClause}
		`;

		const result = await db.execute(query);

		const processed = result.rows.map((row) => {
			const createdAt = new Date(row.created_at as string);
			const updatedAt = new Date(row.updated_at as string);
			const estado = row.estado as string;
			const isClosed = estado === 'cerrado' || estado === 'solucionado';

			const now = new Date(); // muévelo aquí
			const timeElapsedMs = isClosed
				? updatedAt.getTime() - createdAt.getTime()
				: now.getTime() - createdAt.getTime();

			return {
				...row,
				created_at: createdAt,
				updated_at: updatedAt,
				time_elapsed_ms: timeElapsedMs,
			};
		});

		return NextResponse.json(processed);
	} catch (error) {
		console.error('❌ Error fetching tickets:', error);
		return NextResponse.json(
			{ error: 'Error fetching tickets' },
			{ status: 500 }
		);
	}
}

// ========================
// POST /api/admin/tickets
// ========================
export async function POST(request: Request) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = (await request.json()) as CreateTicketBody;
		console.log('📝 Creando nuevo ticket:', body);

		const ticketData = {
			...body,
			creatorId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		console.log('🧾 Datos que se van a guardar:', ticketData);

		if (!ticketData.assignedToId) {
			delete ticketData.assignedToId;
		}

		const newTicket = await db.insert(tickets).values(ticketData).returning();
		console.log('✅ Ticket creado:', newTicket[0]);

		// Enviar correo si el ticket tiene asignado
		if (body.assignedToId) {
			console.log('📧 Buscando usuario asignado:', body.assignedToId);

			try {
				const assignee = await db.query.users.findFirst({
					where: eq(users.id, body.assignedToId),
				});

				if (assignee?.email) {
					console.log('📧 Enviando correo a:', assignee.email);

					const emailResult = await sendTicketEmail({
						to: assignee.email,
						subject: `Nuevo Ticket Asignado #${newTicket[0].id}`,
						html: getNewTicketAssignmentEmail(
							newTicket[0].id,
							body.description
						),
					});

					console.log('📧 Email enviado:', emailResult);
				} else {
					console.log('⚠️ Usuario asignado no tiene correo configurado');
				}
			} catch (error) {
				console.error('❌ Error enviando correo:', error);
			}

			// Agregar comentario de asignación
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
		console.error('❌ Error creando ticket:', error);
		return NextResponse.json(
			{ error: 'Error creating ticket' },
			{ status: 500 }
		);
	}
}

// ========================
// PUT /api/admin/tickets
// ========================
export async function PUT(request: Request) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = (await request.json()) as UpdateTicketBody;
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

export async function DELETE(request: Request) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');

	if (!id) {
		return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
	}

	try {
		await db.delete(tickets).where(eq(tickets.id, Number(id)));
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('❌ Error deleting ticket:', error);
		return NextResponse.json(
			{ error: 'Error deleting ticket' },
			{ status: 500 }
		);
	}
}

// =============================
// PUT /api/admin/tickets/:id/video
// =============================
export async function PUT_video(
	req: Request,
	context: { params: { id: string } }
) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const ticketId = parseInt(context.params.id);
	if (isNaN(ticketId)) {
		return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
	}

	try {
		const { videoKey } = await req.json();

		await db
			.update(tickets)
			.set({
				videoKey,
				updatedAt: new Date(),
			})
			.where(eq(tickets.id, ticketId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('❌ Error actualizando videoKey:', error);
		return NextResponse.json(
			{ error: 'Error updating videoKey' },
			{ status: 500 }
		);
	}
}
