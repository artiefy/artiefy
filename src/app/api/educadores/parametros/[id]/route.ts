import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { updateParametro } from '~/models/educatorsModels/parametrosModels';

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
		}

		const resolvedParams = await params; // Esperar params antes de usar sus propiedades
		const parametroId = parseInt(resolvedParams.id);
		if (isNaN(parametroId)) {
			return NextResponse.json(
				{ error: 'ID de parámetro inválido' },
				{ status: 400 }
			);
		}

		const data = (await request.json()) as {
			name: string;
			description: string;
			porcentaje: number;
			courseId: number;
		};

		const updatedParametro = await updateParametro({
			id: parametroId,
			name: data.name,
			description: data.description,
			porcentaje: data.porcentaje,
			courseId: data.courseId,
		});

		return NextResponse.json(updatedParametro);
	} catch (error) {
		console.error('Error al actualizar el parámetro:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el parámetro' },
			{ status: 500 }
		);
	}
}
