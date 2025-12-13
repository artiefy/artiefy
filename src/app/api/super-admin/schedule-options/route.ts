import { NextRequest, NextResponse } from 'next/server';

import { desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses,scheduleOptions } from '~/server/db/schema';

// GET - Obtener todas las opciones de horarios
export async function GET() {
    try {
        const allSchedules = await db
            .select()
            .from(scheduleOptions)
            .orderBy(desc(scheduleOptions.createdAt));

        return NextResponse.json({
            success: true,
            data: allSchedules,
        });
    } catch (error) {
        console.error('Error fetching schedule options:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch schedule options' },
            { status: 500 }
        );
    }
}

// POST - Crear nueva opción de horario
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, startTime, endTime, isActive } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            );
        }

        const newSchedule = await db
            .insert(scheduleOptions)
            .values({
                name,
                description: description ?? null,
                startTime: startTime ?? null,
                endTime: endTime ?? null,
                isActive: isActive ?? true,
            })
            .returning();

        return NextResponse.json(
            {
                success: true,
                data: newSchedule[0],
                message: 'Schedule option created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating schedule option:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create schedule option' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar opción de horario
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, startTime, endTime, isActive } = body;

        if (!id || !name) {
            return NextResponse.json(
                { success: false, error: 'ID and name are required' },
                { status: 400 }
            );
        }

        const updatedSchedule = await db
            .update(scheduleOptions)
            .set({
                name,
                description: description ?? null,
                startTime: startTime ?? null,
                endTime: endTime ?? null,
                isActive: isActive ?? true,
                updatedAt: new Date(),
            })
            .where(eq(scheduleOptions.id, id as number))
            .returning();

        if (updatedSchedule.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Schedule option not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedSchedule[0],
            message: 'Schedule option updated successfully',
        });
    } catch (error) {
        console.error('Error updating schedule option:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update schedule option' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar opción de horario
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

        // Poner null en scheduleOptionId de todos los cursos que usan esta opción
        await db
            .update(courses)
            .set({ scheduleOptionId: null })
            .where(eq(courses.scheduleOptionId, id as number));

        const deletedSchedule = await db
            .delete(scheduleOptions)
            .where(eq(scheduleOptions.id, id as number))
            .returning();

        if (deletedSchedule.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Schedule option not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Schedule option deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting schedule option:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete schedule option' },
            { status: 500 }
        );
    }
}
