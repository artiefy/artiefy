import { NextResponse } from 'next/server';

import { and, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { anuncios, anunciosCursos, enrollments } from '~/server/db/schema';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id'); // Obtener el ID del usuario desde los headers

    if (!userId) {
      return NextResponse.json(
        { message: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    console.log('📌 Buscando anuncios para usuario:', userId);

    const userCourses = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId));

    console.log('📌 Cursos del usuario:', userCourses);

    const anunciosUsuario = await db
      .select({
        id: anuncios.id,
        titulo: anuncios.titulo,
        descripcion: anuncios.descripcion,
        coverImageKey: anuncios.cover_image_key, // ✅ Ahora se incluye en la respuesta
        tipo_destinatario: anuncios.tipo_destinatario,
        courseId: anunciosCursos.courseId,
      })
      .from(anuncios)
      .innerJoin(anunciosCursos, eq(anuncios.id, anunciosCursos.anuncioId))
      .innerJoin(enrollments, eq(anunciosCursos.courseId, enrollments.courseId))
      .where(and(eq(anuncios.activo, true), eq(enrollments.userId, userId)))
      .orderBy(desc(anuncios.id)); // ✅ Ordenados del más reciente al más antiguo

    // Enviar todos los anuncios en lugar de solo uno
    return NextResponse.json(anunciosUsuario.length > 0 ? anunciosUsuario : []);
  } catch (error) {
    console.error('❌ Error al obtener el anuncio activo:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
