import { type NextRequest, NextResponse } from 'next/server';
import {
	createParametros,
	getParametrosByCourseId,
	updateParametro,
	deleteParametro,
} from '~/models/educatorsModels/parametrosModels';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// GET endpoint para obtener parámetros
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json(
				{ error: 'ID de curso no proporcionado' },
				{ status: 400 }
			);
		}

		const parsedCourseId = parseInt(courseId);
		if (isNaN(parsedCourseId)) {
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		const parametros = await getParametrosByCourseId(parsedCourseId);
		return NextResponse.json(parametros);
	} catch (error) {
		console.error('Error al obtener los parámetros:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los parámetros' },
			{ status: 500 }
		);
	}
}

// POST endpoint para crear parámetros
export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as { name: string; description: string; porcentaje: number; courseId: number };
		console.log('📌 Datos recibidos en la API de parámetros:', body);

		// ✅ Verificar si courseId está presente
		if (!body.courseId || isNaN(body.courseId)) {
			console.error('❌ Error: courseId no recibido o inválido:', body);
			return NextResponse.json(
				{ error: 'courseId es obligatorio' },
				{ status: 400 }
			);
		}

		// ✅ Crear el parámetro en la base de datos
		const parametroCreado = await createParametros({
			name: body.name,
			description: body.description,
			porcentaje: body.porcentaje,
			courseId: Number(body.courseId), // ✅ Asegurar que es un número
		});

		console.log('✅ Parámetro guardado en la base de datos:', parametroCreado);
		return NextResponse.json(parametroCreado);
	} catch (error) {
		console.error('❌ Error en API de parámetros:', error);
		return NextResponse.json(
			{ error: 'Error al crear el parámetro' },
			{ status: 500 }
		);
	}
}


// DELETE endpoint para eliminar parámetros
export async function DELETE(request: NextRequest) {
	try {
		if (!request.body) {
			return respondWithError('Request body is null', 400);
		}
		interface DeleteRequestBody {
			id: string;
		}
		const { id }: DeleteRequestBody =
			(await request.json()) as DeleteRequestBody;
		await deleteParametro(Number(id));
		return NextResponse.json({ message: 'Parámetro eliminado' });
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar el parámetro' },
			{ status: 500 }
		);
	}
}

// PUT endpoint para actualizar parámetros
export async function PUT(request: Request) {
	try {
		const data = (await request.json()) as {
			parametros: {
				id: number;
				name: string;
				description: string;
				porcentaje: number;
				courseId: number;
			}[];
		};

		const updatedParametros = await Promise.all(
			data.parametros.map(async (parametro) => {
				await updateParametro(parametro);
				return parametro;
			})
		);

		return NextResponse.json(updatedParametros);
	} catch (error) {
		console.error('Error al actualizar los parámetros:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar los parámetros' },
			{ status: 500 }
		);
	}
}
