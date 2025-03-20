import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { modalidades } from '~/server/db/schema';

export async function GET() {
    try {
        const result = await db.select().from(modalidades);
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error al obtener modalidades:', error);
        return NextResponse.json({ error: 'Error al obtener modalidades' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, description } = (await req.json()) as { name: string; description: string };
        const result = await db.insert(modalidades).values({ name, description }).returning();
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error al crear modalidad:', error);
        return NextResponse.json({ error: 'Error al crear modalidad' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        interface UpdateModalidadRequest {
            id: number;
            name: string;
            description: string;
        }
        const { id, name, description }: UpdateModalidadRequest = await req.json() as UpdateModalidadRequest;
        const result = await db.update(modalidades).set({ name, description }).where(eq(modalidades.id, id)).returning();
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error al actualizar modalidad:', error);
        return NextResponse.json({ error: 'Error al actualizar modalidad' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id }: { id: number } = await req.json() as { id: number };
        await db.delete(modalidades).where(eq(modalidades.id, id));
        return NextResponse.json({ message: 'Modalidad eliminada' });
    } catch (error) {
        console.error('❌ Error al eliminar modalidad:', error);
        return NextResponse.json({ error: 'Error al eliminar modalidad' }, { status: 500 });
    }
}
