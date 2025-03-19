import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { materias } from '~/server/db/schema';
import { isNull, eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const programId = searchParams.get('programId'); // Obtener el programId de los parámetros

        if (!programId) {
            return NextResponse.json(
                { error: 'El programId es obligatorio' },
                { status: 400 }
            );
        }

        // Filtrar materias donde courseid sea null y pertenezcan al programa
        const filteredMaterias = await db
            .select()
            .from(materias)
            .where(
                and(
                    isNull(materias.courseid),
                    eq(materias.programaId, Number(programId))
                )
            ); // Filtrar por programa y courseid === null

        return NextResponse.json(filteredMaterias);
    } catch (error) {
        console.error('❌ Error fetching subjects:', error);
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}