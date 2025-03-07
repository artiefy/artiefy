
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { eq, desc } from 'drizzle-orm';
import { anuncios } from '~/server/db/schema';


export async function GET() {
    try {
        // Obtener todos los anuncios activos
        const allAnuncios = await db
            .select()
            .from(anuncios)
			.where(eq(anuncios.activo, true)); // Solo anuncios activos

        // ✅ Asegura que siempre devuelve un array
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
		interface AnuncioBody {
			titulo: string;
			descripcion: string;
			imagenUrl: string;
		}

		const body = (await req.json()) as AnuncioBody;
		console.log('📌 Recibido en el backend:', body);

		const { titulo, descripcion, imagenUrl } = body;
		const cover_image_key = imagenUrl; // ✅ Usamos el nombre correcto según la BD

		if (!titulo || !descripcion || !imagenUrl) {
			console.log('❌ Error: Faltan datos');
			return NextResponse.json(
				{ error: 'Todos los campos son obligatorios' },
				{ status: 400 }
			);
		}

		const columns = await db.execute(`
			SELECT column_name
			FROM information_schema.columns
			WHERE table_name = 'anuncios';
		`);
		console.log(columns);

		// 🔹 Guardar en la base de datos
		const nuevoAnuncio = await db
			.insert(anuncios)
			.values({
				titulo,
				descripcion,
				cover_image_key, // ✅ Ahora usamos el nombre correcto
			})
			.returning(); // ✅ Esto devuelve el objeto guardado

		console.log('✅ Anuncio guardado:', nuevoAnuncio);

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


