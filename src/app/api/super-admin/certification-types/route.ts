import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { certificationTypes } from '~/server/db/schema';

export async function GET() {
    try {
        const result = await db.select().from(certificationTypes);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Error al obtener tipos de certificación:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener tipos de certificación' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { name, description, isActive } = (await req.json()) as {
            name: string;
            description?: string;
            isActive?: boolean;
        };

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        const result = await db
            .insert(certificationTypes)
            .values({
                name: name.trim(),
                description: description?.trim() ?? null,
                isActive: isActive ?? true,
            })
            .returning();

        return NextResponse.json({ success: true, message: 'Tipo de certificación creado', data: result[0] });
    } catch (error) {
        console.error('❌ Error al crear tipo de certificación:', error);
        return NextResponse.json(
            { success: false, error: 'Error al crear tipo de certificación' },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const { id, name, description, isActive } = (await req.json()) as {
            id: number;
            name: string;
            description?: string;
            isActive?: boolean;
        };

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'El ID es requerido' },
                { status: 400 }
            );
        }

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        const result = await db
            .update(certificationTypes)
            .set({
                name: name.trim(),
                description: description?.trim() ?? null,
                isActive: isActive ?? true,
                updatedAt: new Date(),
            })
            .where(eq(certificationTypes.id, id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Tipo de certificación no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Tipo de certificación actualizado', data: result[0] });
    } catch (error) {
        console.error('❌ Error al actualizar tipo de certificación:', error);
        return NextResponse.json(
            { success: false, error: 'Error al actualizar tipo de certificación' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = (await req.json()) as { id: number };

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'El ID es requerido' },
                { status: 400 }
            );
        }

        const result = await db
            .delete(certificationTypes)
            .where(eq(certificationTypes.id, id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Tipo de certificación no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Tipo de certificación eliminado' });
    } catch (error) {
        console.error('❌ Error al eliminar tipo de certificación:', error);
        return NextResponse.json(
            { success: false, error: 'Error al eliminar tipo de certificación' },
            { status: 500 }
        );
    }
}
