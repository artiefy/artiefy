import { NextResponse } from 'next/server';
import { db } from '~/server/db/index';
import { categories } from '~/server/db/schema';

export async function GET() {
    try {
        const result = await db.select().from(categories);
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error al obtener categorías:', error);
        return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
    }
}
