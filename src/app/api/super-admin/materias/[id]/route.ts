import { NextResponse } from 'next/server';

import { deleteMateria } from '~/models/super-adminModels/materiaModels';

export async function DELETE(
	_request: Request,
	{ params }: { params: { id: string } }
) {
	if (!params.id) {
		return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
	}

	try {
		const id = Number(params.id);
		if (isNaN(id)) {
			return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
		}

		await deleteMateria(id);
		return NextResponse.json({ message: 'Materia eliminada exitosamente' });
	} catch (error) {
		console.error('Error al eliminar:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
