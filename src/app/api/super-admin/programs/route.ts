import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { materias } from '~/server/db/schema';

export async function GET() {
	try {
		const allMaterias = await db.select().from(materias).execute();
		return NextResponse.json(allMaterias);
	} catch (error) {
		console.error('❌ Error fetching subjects:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
