import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Llama al webhook de n8n con el prompt
    const n8nWebhookUrl =
      'http://localhost:5678/prueba-de-webhook/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7';
    let keywords: string[] = [];
    try {
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      // Tipar la respuesta para evitar acceso inseguro
      interface N8nResponse {
        keywords?: string[];
      }
      const n8nData: N8nResponse = await n8nRes.json();
      keywords = n8nData.keywords ?? [];
    } catch (_err) {
      return new Response(
        JSON.stringify({ error: 'Error llamando al agente IA de n8n' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!keywords.length) {
      return new Response(JSON.stringify({ cursos: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Busca los cursos más relacionados usando Drizzle ORM y SQL ILIKE, solo id y titulo
    try {
      const conditions = keywords
        .map(
          (kw) =>
            `(courses.title ILIKE '%${kw.replace(/'/g, "''")}%'
              OR courses.description ILIKE '%${kw.replace(/'/g, "''")}%')`
        )
        .join(' OR ');

      // Selecciona solo id y título
      const query = db
        .select({
          id: courses.id,
          titulo: courses.title,
        })
        .from(courses)
        .where(sql.raw(conditions))
        .limit(5);

      const cursos = await query;

      return new Response(JSON.stringify({ cursos }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_err) {
      return new Response(
        JSON.stringify({ error: 'Error consultando la base de datos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Error procesando la solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
