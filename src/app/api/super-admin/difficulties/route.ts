import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '~/server/db/index';
import { dificultad } from '~/server/db/schema';

export async function GET() {
    try {
        const result = await db.select().from(dificultad);
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error al obtener dificultades:', error);
        return NextResponse.json({ error: 'Error al obtener dificultades' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, description }: { name: string; description: string } = await req.json() as { name: string; description: string };
        const result = await db.insert(dificultad).values({ name, description }).returning();
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error al crear dificultad:', error);
        return NextResponse.json({ error: 'Error al crear dificultad' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, name, description }: { id: number; name: string; description: string } = await req.json() as { id: number; name: string; description: string };
        const result = await db.update(dificultad).set({ name, description }).where(eq(dificultad.id, id)).returning();
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error al actualizar dificultad:', error);
        return NextResponse.json({ error: 'Error al actualizar dificultad' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id }: { id: number } = await req.json() as { id: number };
        await db.delete(dificultad).where(eq(dificultad.id, id));
        return NextResponse.json({ message: 'Dificultad eliminada' });
    } catch (error) {
        console.error('❌ Error al eliminar dificultad:', error);
        return NextResponse.json({ error: 'Error al eliminar dificultad' }, { status: 500 });
    }
}
