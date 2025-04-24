import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { ticketComments } from '~/server/db/schema';

export async function GET(
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

		const comments = await db.query.ticketComments.findMany({
			where: eq(ticketComments.ticketId, ticketId),
			with: {
				user: true,
			},
			orderBy: (comments, { desc }) => [desc(comments.createdAt)],
		});

		return NextResponse.json(comments);
	} catch (error) {
		console.error('Error fetching comments:', error);
		return NextResponse.json(
			{ error: 'Error fetching comments' },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || (role !== 'admin' && role !== 'super-admin')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const ticketId = Number(params.id);
		if (isNaN(ticketId)) {
			return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
		}

		const { content } = await request.json();
		if (!content) {
			return NextResponse.json(
				{ error: 'Comment content is required' },
				{ status: 400 }
			);
		}

		const newComment = await db
			.insert(ticketComments)
			.values({
				ticketId,
				userId,
				content,
				createdAt: new Date(),
			})
			.returning();

		return NextResponse.json(newComment[0]);
	} catch (error) {
		console.error('Error creating comment:', error);
		return NextResponse.json(
			{ error: 'Error creating comment' },
			{ status: 500 }
		);
	}
}
