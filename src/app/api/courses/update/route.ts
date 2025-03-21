import { NextResponse } from 'next/server';

import { updateCourse } from '~/models/super-adminModels/courseModelsSuperAdmin';

export async function PUT(request: Request) {
	try {
		interface RequestBody {
			id: string;
			title: string;
			description: string;
			coverImageKey?: string;
			categoryid?: string;
			modalidadesid?: string;
			nivelid?: string;
			instructor?: string;
		}

		const body: RequestBody = (await request.json()) as RequestBody;
		console.log('🔹 Recibido en API:', body); // ✅ Verifica qué datos llegan al backend

		if (!body.id || !body.title || !body.description) {
			return NextResponse.json(
				{ error: 'Datos incompletos para actualizar el curso' },
				{ status: 400 }
			);
		}

		// Intentamos actualizar el curso en la base de datos
		await updateCourse(Number(body.id), {
			title: body.title,
			description: body.description,
			coverImageKey: body.coverImageKey ?? '',
			categoryid: body.categoryid ? Number(body.categoryid) : 0,
			modalidadesid: body.modalidadesid ? Number(body.modalidadesid) : 0,
			nivelid: body.nivelid ? Number(body.nivelid) : 0,
			instructor: body.instructor ?? '',
		});

		console.log(`✅ Curso ${body.id} actualizado correctamente`);
		return NextResponse.json({ message: 'Curso actualizado correctamente' });
	} catch (error) {
		console.error('❌ Error en la API de actualización:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
