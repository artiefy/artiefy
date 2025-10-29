import { NextResponse } from 'next/server';

import { ilike, or, type SQL } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

interface RequestBody {
  prompt: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { prompt } = body;

    console.log('🔍 Searching for:', prompt);

    // Buscar cursos en la base de datos local usando palabras clave
    let localCourses: { id: number; title: string }[] = [];

    // Buscar por palabras clave en título y descripción
    const keywords = prompt
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 2); // Reducir filtro de 3 a 2 caracteres
    if (keywords.length > 0) {
      // Filtra para evitar undefined en el array de condiciones
      const keywordConditions: SQL[] = keywords
        .map((kw) =>
          kw
            ? or(
                ilike(courses.title, `%${kw}%`),
                ilike(courses.description, `%${kw}%`)
              )
            : undefined
        )
        .filter(Boolean) as SQL[];
      if (keywordConditions.length > 0) {
        localCourses = await db
          .select({
            id: courses.id,
            title: courses.title,
          })
          .from(courses)
          .where(or(...keywordConditions))
          .limit(5);
      }
    }

    // Formatear respuesta con los IDs locales
    if (localCourses.length > 0) {
      const formattedResponse = `He encontrado estos cursos que podrían interesarte:\n\n${localCourses
        .map((course, idx) => `${idx + 1}. ${course.title}|${course.id}`)
        .join('\n\n')}`;
      return NextResponse.json({
        response: formattedResponse,
        courses: localCourses,
      });
    }

    // Si no hay cursos, responde con mensaje claro pero sin inventar cursos
    return NextResponse.json({
      response:
        'Lo siento, hubo un problema al procesar tu búsqueda. Por favor, intenta de nuevo.',
      courses: [],
    });
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json(
      {
        response:
          'Lo siento, hubo un problema al procesar tu búsqueda. Por favor, intenta de nuevo.',
        courses: [],
      },
      { status: 500 }
    );
  }
}
