import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import {
	anuncios,
	anunciosCursos,
	anunciosProgramas,
	anunciosUsuarios,
} from '~/server/db/schema';

export async function GET() {
	try {
		// Obtener todos los anuncios activos
		const allAnuncios = await db
			.select()
			.from(anuncios)
			.where(eq(anuncios.activo, true)); // Solo anuncios activos

		return NextResponse.json(Array.isArray(allAnuncios) ? allAnuncios : []);
	} catch (error) {
		console.error('❌ Error al obtener los anuncios:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}


export async function POST(req: Request) {
	try {
		const body: unknown = await req.json();

		// 🔹 Validar que `body` es un objeto válido
		if (
			typeof body !== 'object' ||
			body === null ||
			!('titulo' in body) ||
			!('descripcion' in body) ||
			!('imagenUrl' in body) ||
			!('tipo_destinatario' in body)
		) {
			return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
		}

		// 🔹 Convertimos `body` en un objeto tipado seguro
		const parsedBody = body as {
			titulo: string;
			descripcion: string;
			imagenUrl: string;
			tipo_destinatario: 'todos' | 'cursos' | 'programas' | 'custom';
			courseIds?: unknown;
			programaIds?: unknown;
			userIds?: unknown;
		};

		// 🔹 Extraemos propiedades de forma segura
		const { titulo, descripcion, imagenUrl, tipo_destinatario } = parsedBody;

		// 🔹 Validaciones de campos obligatorios
		if (!titulo.trim() || !descripcion.trim() || !imagenUrl.trim()) {
			return NextResponse.json(
				{ error: 'Todos los campos son obligatorios' },
				{ status: 400 }
			);
		}

		// 🔹 Crear el anuncio en la tabla `anuncios`
		const [nuevoAnuncio] = await db
			.insert(anuncios)
			.values({
				titulo,
				descripcion,
				cover_image_key: imagenUrl,
				tipo_destinatario,
			})
			.returning();

		// 📌 Validar que se creó el anuncio antes de continuar
		if (!nuevoAnuncio) {
			return NextResponse.json(
				{ error: 'Error al crear el anuncio' },
				{ status: 500 }
			);
		}

		console.log('✅ Anuncio creado correctamente:', nuevoAnuncio);

		// 🔹 Convertir `courseIds` a un array de números seguros
		const courseIds: number[] = Array.isArray(parsedBody.courseIds)
			? parsedBody.courseIds
					.map((id) => Number(id)) // Convertir a número
					.filter((id) => !isNaN(id)) // Filtrar valores inválidos
			: [];

		console.log(
			'📌 Cursos recibidos antes de insertar en anunciosCursos:',
			courseIds
		);

		// 🔹 Insertar cursos asociados al anuncio en `anunciosCursos`
		if (tipo_destinatario === 'cursos' && courseIds.length > 0) {
			try {
				await db.insert(anunciosCursos).values(
					courseIds.map((courseId) => ({
						anuncioId: nuevoAnuncio.id,
						courseId,
					}))
				);
				console.log('✅ Anuncios insertados en anunciosCursos');
			} catch (err) {
				console.error('❌ Error al insertar en anunciosCursos:', err);
			}
		} else {
			console.warn(
				'⚠️ No se insertaron anuncios en anunciosCursos (Sin cursos seleccionados o error en conversión).'
			);
		}

		// 🔹 Validar `programaIds` y `userIds`
		const programaIds: number[] = Array.isArray(parsedBody.programaIds)
			? parsedBody.programaIds
					.map((id) => Number(id))
					.filter((id) => !isNaN(id))
			: [];

		if (tipo_destinatario === 'programas' && programaIds.length > 0) {
			await db.insert(anunciosProgramas).values(
				programaIds.map((programaId) => ({
					anuncioId: nuevoAnuncio.id,
					programaId,
				}))
			);
		}

		const userIds: string[] = Array.isArray(parsedBody.userIds)
			? parsedBody.userIds.filter((id): id is string => typeof id === 'string')
			: [];

		if (tipo_destinatario === 'custom' && userIds.length > 0) {
			await db.insert(anunciosUsuarios).values(
				userIds.map((userId) => ({
					anuncioId: nuevoAnuncio.id,
					userId,
				}))
			);
		}

		// ✅ Responder con éxito
		return NextResponse.json(
			{ message: 'Anuncio guardado correctamente', anuncio: nuevoAnuncio },
			{ status: 201 }
		);
	} catch (error) {
		console.error('❌ Error al guardar el anuncio:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
