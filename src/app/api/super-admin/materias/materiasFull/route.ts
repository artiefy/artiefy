import { type NextRequest, NextResponse } from 'next/server';

import {
	getAllMateriasFull,
	getMateriaById,
	createMateria,
	updateMateria,
	deleteMateria,
} from '~/models/super-adminModels/materiaModels';

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get('id');

	if (id) {
		try {
			const materia = await getMateriaById(Number(id));
			if (!materia) {
				return NextResponse.json(
					{ error: 'Materia not found' },
					{ status: 404 }
				);
			}
			return NextResponse.json(materia);
		} catch (error) {
			const errorMessage = (error as Error).message;
			return NextResponse.json(
				{ error: 'Failed to fetch materia', details: errorMessage },
				{ status: 500 }
			);
		}
	} else {
		try {
			const materias = await getAllMateriasFull();
			return NextResponse.json(materias);
		} catch (error) {
			const errorMessage = (error as Error).message;
			return NextResponse.json(
				{ error: 'Failed to fetch materias', details: errorMessage },
				{ status: 500 }
			);
		}
	}
}

interface MateriaBody {
	name: string;
	title: string;
	description: string;
}

export async function POST(req: NextRequest) {
	try {
		const body: MateriaBody = (await req.json()) as MateriaBody;
		console.log('POST body:', body); // Log the request body
		const newMateria = await createMateria(body);
		console.log('POST newMateria:', newMateria); // Log the created materia
		return NextResponse.json(newMateria);
	} catch (error) {
		const errorMessage = (error as Error).message;
		console.error('POST error:', errorMessage); // Log the error message
		return NextResponse.json(
			{ error: 'Failed to create materia', details: errorMessage },
			{ status: 500 }
		);
	}
}

export async function PUT(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get('id');

	if (!id) {
		return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
	}

	try {
		const body: MateriaBody = (await req.json()) as MateriaBody;
		console.log('PUT body:', body); // Muestra los datos recibidos

		const updatedMateria = await updateMateria(Number(id), body);
		console.log('PUT updatedMateria:', updatedMateria); // Muestra el resultado de la actualización

		return NextResponse.json(updatedMateria);
	} catch (error) {
		if (error instanceof Error) {
			console.error('PUT error:', error.message); // Muestra el mensaje de error
		} else {
			console.error('PUT error:', error); // Muestra el error si no es una instancia de Error
		}
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json(
			{ error: 'Failed to update materia', details: errorMessage },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
		await deleteMateria(Number(id));
		return NextResponse.json({ message: 'Materia eliminada exitosamente' });
	} catch (error) {
		const errorMessage = (error as Error).message;
		return NextResponse.json(
			{ error: 'Failed to delete materia', details: errorMessage },
			{ status: 500 }
		);
	}
}
