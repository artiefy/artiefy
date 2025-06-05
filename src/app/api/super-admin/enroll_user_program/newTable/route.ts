import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { userCustomFields } from '~/server/db/schema';
import { z } from 'zod';

// Validación de entrada
const requestBodySchema = z.object({
	userId: z.string(),
	fieldKey: z.string(),
	fieldValue: z.string(),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { userId, fieldKey, fieldValue } = requestBodySchema.parse(body);

		// Insertar el nuevo campo personalizado
		await db.insert(userCustomFields).values({
			userId,
			fieldKey,
			fieldValue,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: 'Error al crear el campo personalizado' },
			{ status: 500 }
		);
	}
}


