import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { sql, eq } from 'drizzle-orm';

import {
	sendTicketEmail,
	getNewTicketAssignmentEmail,
} from '~/lib/emails/ticketEmails';
import { db } from '~/server/db';
import {
	tickets,
	users,
	ticketComments,
	ticketAssignees,
} from '~/server/db/schema';

interface CreateTicketBody {
	email: string;
	tipo: 'otro' | 'bug' | 'revision' | 'logs';
	description: string;
	comments: string;
	estado: 'abierto' | 'en proceso' | 'en revision' | 'solucionado' | 'cerrado';
	assignedToIds?: string[];
	coverImageKey?: string | null;
	videoKey?: string | null;
	documentKey?: string | null;
}

interface UpdateTicketBody
	extends Partial<Omit<CreateTicketBody, 'assignedToId'>> {
	id: number;
	assignedToIds?: string[];
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
		t.video_key,
		t.document_key
	FROM tickets t
	LEFT JOIN users c ON t.creator_id = c.id
	${whereClause}
`;
		console.log(ticketAssignees);
		const assignedUsers = await db
			.select({
				ticketId: ticketAssignees.ticketId,
				userId: users.id, // 👈 AÑADIDO
				userName: users.name,
				userEmail: users.email,
			})

			.from(ticketAssignees)
			.leftJoin(users, eq(ticketAssignees.userId, users.id));

		const assignedMap = new Map<
			number,
			{ id: string; name: string; email: string }[]
		>();

		for (const row of assignedUsers) {
			if (!assignedMap.has(row.ticketId)) {
				assignedMap.set(row.ticketId, []);
			}
			assignedMap.get(row.ticketId)?.push({
				id: row.userId ?? '',
				name: row.userName ?? '',
				email: row.userEmail ?? '',
			});
		}

		const result = await db.execute(query);

		const processed = result.rows.map((row) => {
			const createdAt = new Date(row.created_at as string);
			const updatedAt = new Date(row.updated_at as string);
			const estado = row.estado as string;
			const isClosed = estado === 'cerrado' || estado === 'solucionado';

			const now = new Date();
			const timeElapsedMs = isClosed
				? updatedAt.getTime() - createdAt.getTime()
				: now.getTime() - createdAt.getTime();

			const assigned = assignedMap.get(Number(row.id)) ?? [];

			return {
				...row,
				created_at: createdAt,
				updated_at: updatedAt,
				time_elapsed_ms: timeElapsedMs,
				assigned_users: assigned,
				assignedToIds: assigned.map((u) => u.id), // ✅ necesario para que el <Select /> funcione
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
		if (!body.email || !body.tipo || !body.estado || !body.description) {
			return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
		}

		console.log('📝 Creando nuevo ticket:', body);

		const ticketData = {
			...body,
			creatorId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		console.log('🧾 Datos que se van a guardar:', ticketData);

		delete ticketData.assignedToIds;

		const newTicket = await db.insert(tickets).values(ticketData).returning();
		console.log('✅ Ticket creado:', newTicket[0]);
		if (body.assignedToIds && body.assignedToIds.length > 0) {
			await Promise.all(
				body.assignedToIds.map((assignedUserId) =>
					db.insert(ticketAssignees).values({
						ticketId: newTicket[0].id,
						userId: assignedUserId,
					})
				)
			);
		}

		// Enviar correos si el ticket tiene asignaciones
		if (body.assignedToIds && body.assignedToIds.length > 0) {
			console.log('📧 Usuarios asignados:', body.assignedToIds);

			for (const assignedId of body.assignedToIds) {
				try {
					const assignee = await db.query.users.findFirst({
						where: eq(users.id, assignedId),
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
					console.error(`❌ Error enviando correo a ${assignedId}:`, error);
				}
			}

			// Agregar comentario indicando que se asignó a múltiples usuarios
			console.log('📝 Agregando comentario de asignación múltiple');
			await db.insert(ticketComments).values({
				ticketId: newTicket[0].id,
				userId,
				content: `Ticket creado y asignado a ${body.assignedToIds.length} usuario(s)`,
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

		// 1. Actualizar datos generales del ticket
		const updatedTicket = await db
			.update(tickets)
			.set({
				email: updateData.email,
				description: updateData.description,
				estado: updateData.estado,
				tipo: updateData.tipo,
				comments: updateData.comments,
				coverImageKey: updateData.coverImageKey,
				videoKey: updateData.videoKey,
				documentKey: updateData.documentKey,
				updatedAt: new Date(),
			})
			.where(eq(tickets.id, id))
			.returning();

		// 2. Actualizar asignaciones si se envían
		if (body.assignedToIds) {
			// Eliminar anteriores
			await db.delete(ticketAssignees).where(eq(ticketAssignees.ticketId, id));

			// Insertar nuevas
			await Promise.all(
				body.assignedToIds.map((userId) =>
					db.insert(ticketAssignees).values({
						ticketId: id,
						userId,
					})
				)
			);
		}

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
		const { videoKey } = (await req.json()) as { videoKey: string };

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
