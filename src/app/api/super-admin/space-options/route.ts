import { NextRequest, NextResponse } from 'next/server';

import { desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses,spaceOptions } from '~/server/db/schema';

// GET - Obtener todas las opciones de espacios
export async function GET() {
    try {
        const allSpaces = await db
            .select()
            .from(spaceOptions)
            .orderBy(desc(spaceOptions.createdAt));

        return NextResponse.json({
            success: true,
            data: allSpaces,
        });
    } catch (error) {
        console.error('Error fetching space options:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch space options' },
            { status: 500 }
        );
    }
}

// POST - Crear nueva opción de espacio
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, location, capacity, isActive } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            );
        }

        const newSpace = await db
            .insert(spaceOptions)
            .values({
                name: String(name),
                description: description ? String(description) : null,
                location: location ? String(location) : null,
                capacity: capacity ? parseInt(String(capacity)) : null,
                isActive: isActive ?? true,
            } as typeof spaceOptions.$inferInsert)
            .returning();

        return NextResponse.json(
            {
                success: true,
                data: newSpace[0],
                message: 'Space option created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating space option:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create space option' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar opción de espacio
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, location, capacity, isActive } = body;

        if (!id || !name) {
            return NextResponse.json(
                { success: false, error: 'ID and name are required' },
                { status: 400 }
            );
        }

        const updatedSpace = await db
            .update(spaceOptions)
            .set({
                name: String(name),
                description: description ? String(description) : null,
                location: location ? String(location) : null,
                capacity: capacity ? parseInt(String(capacity)) : null,
                isActive: isActive ?? true,
                updatedAt: new Date(),
            } as typeof spaceOptions.$inferSelect)
            .where(eq(spaceOptions.id, id as number))
            .returning();

        if (updatedSpace.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Space option not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedSpace[0],
            message: 'Space option updated successfully',
        });
    } catch (error) {
        console.error('Error updating space option:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update space option' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar opción de espacio
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID is required' },
                { status: 400 }
            );
        }

        // Poner null en spaceOptionId de todos los cursos que usan esta opción
        await db
            .update(courses)
            .set({ spaceOptionId: null })
            .where(eq(courses.spaceOptionId, id as number));

        const deletedSpace = await db
            .delete(spaceOptions)
            .where(eq(spaceOptions.id, id as number))
            .returning();

        if (deletedSpace.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Space option not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Space option deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting space option:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete space option' },
            { status: 500 }
        );
    }
}
