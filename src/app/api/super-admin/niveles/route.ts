import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '~/server/db/index';
import { nivel } from '~/server/db/schema';

export async function GET() {
	try {
		const result = await db.select().from(nivel);
		return NextResponse.json(result);
	} catch (error) {
		console.error('❌ Error al obtener niveles:', error);
		return NextResponse.json(
			{ error: 'Error al obtener niveles' },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	try {
		const { name, description }: { name: string; description: string } =
			(await req.json()) as { name: string; description: string };
		const result = await db
			.insert(nivel)
			.values({ name, description })
			.returning();
		return NextResponse.json(result);
	} catch (error) {
		console.error('❌ Error al crear nivel:', error);
		return NextResponse.json(
			{ error: 'Error al crear nivel' },
			{ status: 500 }
		);
	}
}

export async function PUT(req: Request) {
	try {
		const {
			id,
			name,
			description,
		}: { id: number; name: string; description: string } =
			(await req.json()) as { id: number; name: string; description: string };
		const result = await db
			.update(nivel)
			.set({ name, description })
			.where(eq(nivel.id, id))
			.returning();
		return NextResponse.json(result);
	} catch (error) {
		console.error('❌ Error al actualizar nivel:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar nivel' },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: Request) {
	try {
		const { id }: { id: number } = (await req.json()) as { id: number };
		await db.delete(nivel).where(eq(nivel.id, id));
		return NextResponse.json({ message: 'nivel eliminada' });
	} catch (error) {
		console.error('❌ Error al eliminar nivel:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar nivel' },
			{ status: 500 }
		);
	}
}
