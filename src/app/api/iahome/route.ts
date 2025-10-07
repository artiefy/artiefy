import { NextResponse } from 'next/server';

import { ilike, or, type SQL } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

interface RequestBody {
  prompt: string;
}

interface ApiResponse {
  result: { id: number; title: string }[];
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { prompt } = body;

    console.log('🔍 Searching for:', prompt);

    // 1. Obtener sugerencias de títulos de la API externa
    const response = await fetch('http://18.117.124.192:5000/root_courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.toLowerCase().trim(),
      }),
    });

    const data = (await response.json()) as ApiResponse;

    // 2. Buscar cursos en la base de datos local usando los títulos sugeridos
    let localCourses: { id: number; title: string }[] = [];
    if (data?.result && Array.isArray(data.result) && data.result.length > 0) {
      const titleConditions: SQL[] = data.result.map((course) =>
        ilike(courses.title, `%${course.title}%`)
      );

      localCourses = await db
        .select({
          id: courses.id,
          title: courses.title,
        })
        .from(courses)
        .where(or(...titleConditions))
        .limit(5);
    }

    // 3. Si no hay coincidencias exactas, buscar por palabras clave en título y descripción
    if (!localCourses.length) {
      const keywords = prompt
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 3);
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
    }

    // 4. Formatear respuesta con los IDs locales
    if (localCourses.length > 0) {
      const formattedResponse = `He encontrado estos cursos que podrían interesarte:\n\n${localCourses
        .map((course, idx) => `${idx + 1}. ${course.title}|${course.id}`)
        .join('\n\n')}`;
      return NextResponse.json({
        response: formattedResponse,
        courses: localCourses,
      });
    }

    // 5. Si aún no hay cursos, responde con mensaje claro pero sin inventar cursos
    return NextResponse.json({
      response: `No encontré cursos relacionados con "${prompt}" en nuestra plataforma. Por favor, intenta con otros términos o revisa la oferta actual de cursos.`,
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
