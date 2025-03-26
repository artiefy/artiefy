import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { categories } from '~/server/db/schema';

export async function GET() {
	try {
		const result = await db.select().from(categories);
		return NextResponse.json(result);
	} catch (error) {
		console.error('❌ Error al obtener categorías:', error);
		return NextResponse.json(
			{ error: 'Error al obtener categorías' },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as {
			name: string;
			description: string;
			is_featured: boolean;
		};
		const { name, description, is_featured } = body;
		const result = await db
			.insert(categories)
			.values({ name, description, is_featured })
			.returning();
		return NextResponse.json(result);
	} catch (error) {
		console.error('❌ Error al crear categoría:', error);
		return NextResponse.json(
			{ error: 'Error al crear categoría' },
			{ status: 500 }
		);
	}
}

export async function PUT(req: Request) {
	try {
		const body = (await req.json()) as unknown;
		const { id, name, description, is_featured } = body as {
			id: number;
			name: string;
			description: string;
			is_featured: boolean;
		};
		const result = await db
			.update(categories)
			.set({ name, description, is_featured })
			.where(eq(categories.id, id))
			.returning();
		return NextResponse.json(result);
	} catch (error) {
		console.error('❌ Error al actualizar categoría:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar categoría' },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: Request) {
	try {
		const { id }: { id: number } = (await req.json()) as { id: number };
		await db.delete(categories).where(eq(categories.id, id));
		return NextResponse.json({ message: 'Categoría eliminada' });
	} catch (error) {
		console.error('❌ Error al eliminar categoría:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar categoría' },
			{ status: 500 }
		);
	}
}
