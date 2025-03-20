import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { isNull, eq, and, inArray } from 'drizzle-orm'; // ✅ Importar inArray
import { z } from 'zod';

import { createProgram } from '~/models/super-adminModels/programModelsSuperAdmin';
import { db } from '~/server/db';
import { materias } from '~/server/db/schema';


export async function POST(req: NextRequest) {
    try {
        // Obtener el usuario autenticado
        const { userId } = await auth() as { userId: string | null };
        console.log('✅ Usuario autenticado:', userId);
        console.log('📌 Recibiendo solicitud POST...');
        if (!userId) {
            console.error('❌ Error: Usuario no autenticado.');
            return NextResponse.json(
                { error: 'Usuario no autenticado.' },
                { status: 401 }
            );
        }

        // Leer el cuerpo de la solicitud
        interface RequestBody {
            title: string;
            description: string;
            coverImageKey?: string;
            categoryid: number;
            rating?: number;
            subjectIds?: number[]; // ✅ Agregamos subjectIds como un array de números opcional
        }

        const schema = z.object({
            title: z.string(),
            description: z.string(),
            coverImageKey: z.string().optional(),
            categoryid: z.number(),  // Cambiado a number
            rating: z.number().optional(),  // Cambiado a number
            subjectIds: z.array(z.number()).optional(),
        });

        const body = schema.parse(await req.json()); // 📌 Validar y parsear JSON
        console.log('📥 Datos recibidos:', body);
        // Validar los campos requeridos manualmente
        const { title, description, coverImageKey, categoryid, rating, subjectIds = [] } = body;

        if (!title || !description || !categoryid) {
            console.error('❌ Error: Campos requeridos faltantes.');
            return NextResponse.json(
                { error: 'Faltan campos requeridos: title, description, categoryid.' },
                { status: 400 }
            );
        }

        // Crear el programa en la base de datos
        console.log('📤 Insertando programa en la base de datos...');
        const newProgram = await createProgram({
            title,
            description,
            coverImageKey: coverImageKey ?? null,
            categoryid: Number(categoryid),
            rating: rating ? Number(rating) : null,
            creatorId: userId,
        });
        console.log('✅ Programa insertado con ID:', newProgram.id);


        // Obtener las materias seleccionadas del cuerpo de la solicitud
       // 📌 Extraer subjectIds del request

       if (!Array.isArray(subjectIds) || subjectIds.some(id => typeof id !== 'number')) {
           console.error('❌ Error: subjectIds no es un array válido de números');
           return NextResponse.json(
               { error: 'subjectIds debe ser un array de números.' },
               { status: 400 }
           );
       }
       // 📌 Validar y actualizar materias
       console.log('📌 Actualizando materias con los IDs:', subjectIds);
       if (subjectIds.length > 0) {
        console.log('📌 Actualizando materias:', subjectIds);

        // Validar que las materias existan antes de actualizar
        const existingMaterias = await db
            .select({ id: materias.id })
            .from(materias)
            .where(inArray(materias.id, subjectIds))
            .execute();

        const existingIds = existingMaterias.map((m) => m.id);

        if (existingIds.length === 0) {
            return NextResponse.json(
                { error: 'No existen materias con los IDs proporcionados' },
                { status: 400 }
            );
        }

        await db
            .update(materias)
            .set({ programaId: newProgram.id })
            .where(inArray(materias.id, existingIds))
            .execute();
    }

        console.log('✅ Materias asignadas al programa:', subjectIds);


        console.log('✅ Programa insertado:', newProgram);
        return NextResponse.json(newProgram, { status: 201 });
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error('❌ Error al crear el programa:', errorMessage);
        return NextResponse.json(
            { error: 'Error al crear el programa', details: errorMessage },
            { status: 500 }
        );
    }
}

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

