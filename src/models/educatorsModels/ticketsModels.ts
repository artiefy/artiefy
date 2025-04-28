import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { tickets } from '~/server/db/schema';

export interface Ticket {
	id: number;
	comments: string;
	description: string;
	estado: boolean;
	email: string;
	coverImageKey: string | null;
	userId: string;
	createdAt: string | number | Date;
	updatedAt: string | number | Date;
}

// Crear un nuevo ticket
export async function createTicket({
	comments,
	description,
	email,
	coverImageKey,
	userId,
}: {
	comments: string;
	description: string;
	coverImageKey: string;
	email: string;
	userId: string;
}) {
	try {
		return db.insert(tickets).values({
			description,
			comments, // <-- también faltaba comments
			coverImageKey: coverImageKey || null,
			estado: 'abierto',
			email,
			creatorId: userId, // <-- corregido aquí
			tipo: 'otro', // <-- falta en tu insert porque "tipo" es obligatorio en la tabla
		});
	} catch (error) {
		console.error('Error al crear el ticket:', error);
	}
}

// Obtener todos los tickets
export function getTickets() {
	try {
		return db.select({
			id: tickets.id,
			comments: tickets.comments,
			description: tickets.description,
			estado: tickets.estado,
			coverImageKey: tickets.coverImageKey,
			email: tickets.email,
			userId: tickets.creatorId,
			createdAt: tickets.createdAt,
			updatedAt: tickets.updatedAt,
		});
	} catch (error) {
		console.error('Error al obtener los tickets:', error);
	}
}

// Obtener tickets por userId
export function getTicketsByUserId(userId: string) {
	try {
		return db
			.select({
				id: tickets.id,
				comments: tickets.comments,
				description: tickets.description,
				estado: tickets.estado,
				coverImageKey: tickets.coverImageKey,
				email: tickets.email,
				userId: tickets.creatorId,
				createdAt: tickets.createdAt,
				updatedAt: tickets.updatedAt,
			})
			.from(tickets)
			.where(eq(tickets.creatorId, userId));
	} catch (error) {
		console.error('Error al obtener los tickets:', error);
	}
}

// Actualizar el estado de un ticket
export async function updateTicketState(ticketId: number) {
	try {
		return db
			.update(tickets)
			.set({ estado: 'solucionado' })
			.where(eq(tickets.id, ticketId));
	} catch (error) {
		console.error('Error al actualizar el estado del ticket:', error);
	}
}

// Eliminar un ticket
export async function deleteTicket(ticketId: number) {
	try {
		return db.delete(tickets).where(eq(tickets.id, ticketId));
	} catch (error) {
		console.error('Error al eliminar el ticket:', error);
	}
}
