import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function GET() {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const adminUsers = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
			})
			.from(users)
			.where(or(eq(users.role, 'admin'), eq(users.role, 'super-admin')));

		return NextResponse.json(adminUsers);
	} catch (error) {
		console.error('❌ Error fetching admin users:', error);
		return NextResponse.json(
			{ error: 'Error fetching admin users' },
			{ status: 500 }
		);
	}
}
