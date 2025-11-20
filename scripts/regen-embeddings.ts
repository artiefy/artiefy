#!/usr/bin/env tsx
/*
  scripts/regen-embeddings.ts
  Recalcula embeddings de TODOS los cursos y los guarda en la columna pgvector `courses.embedding`.

  Requisitos:
  - .env con OPENAI_API_KEY configurada
  - Conexión a DB (usa la misma de la app via src/server/db)
  - Node 22+ y dev dep `tsx`

  Uso:
    # Recalcular todo con concurrencia 2
    npx tsx scripts/regen-embeddings.ts --concurrency=2

    # Limitar a N cursos
    npx tsx scripts/regen-embeddings.ts --limit=50

    # Filtrar por IDs específicos
    npx tsx scripts/regen-embeddings.ts --ids=1,2,3

    # Seco (no escribe en DB)
    npx tsx scripts/regen-embeddings.ts --dry
*/

import { eq, inArray } from 'drizzle-orm';
import { setTimeout as sleep } from 'timers/promises';

import { db } from '../src/server/db';
import { courses } from '../src/server/db/schema';

import 'dotenv/config';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

if (!OPENAI_API_KEY) {
  console.error('ERROR: Falta OPENAI_API_KEY en el entorno');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string | boolean> = {};
  for (const a of args) {
    const [k, v] = a.includes('=') ? a.split('=') : [a, 'true'];
    out[k.replace(/^--/, '')] = v === 'true' ? true : v === 'false' ? false : v;
  }
  return out;
}

function buildCourseText(course: {
  title: string;
  description?: string | null;
}) {
  const parts: string[] = [];
  const title = course.title ?? '';
  const description = course.description ?? '';
  if (title) parts.push(title);
  if (description) parts.push(description);

  const lower = (title + ' ' + description).toLowerCase();

  if (lower.includes('veterin') || lower.includes('animal')) {
    parts.push(
      'veterinario veterinaria animales mascotas salud animal clínica veterinaria cuidado animal'
    );
  }
  if (
    lower.includes('programa') ||
    lower.includes('software') ||
    lower.includes('desarroll') ||
    lower.includes('código') ||
    lower.includes('comput') ||
    lower.includes('web') ||
    lower.includes('frontend') ||
    lower.includes('backend')
  ) {
    parts.push(
      'programación software desarrollo web frontend backend código computación informática sistemas aplicaciones tecnología'
    );
  }
  if (
    lower.includes('salud') ||
    lower.includes('medic') ||
    lower.includes('enfermer') ||
    lower.includes('clínica') ||
    lower.includes('hospital')
  ) {
    parts.push(
      'salud medicina enfermería clínica hospital atención médica bienestar fisiología anatomía biología'
    );
  }
  if (
    lower.includes('belleza') ||
    lower.includes('estética') ||
    lower.includes('cosmetología') ||
    lower.includes('maquillaje')
  ) {
    parts.push(
      'belleza estética cosmetología maquillaje cuidado personal spa tratamientos piel cabello uñas'
    );
  }
  if (
    lower.includes('negocio') ||
    lower.includes('empresa') ||
    lower.includes('emprendimiento') ||
    lower.includes('administración') ||
    lower.includes('finanzas')
  ) {
    parts.push(
      'negocios empresa emprendimiento administración finanzas marketing ventas gestión comercial economía liderazgo'
    );
  }
  if (
    lower.includes('educación') ||
    lower.includes('docente') ||
    lower.includes('pedagogía') ||
    lower.includes('enseñanza')
  ) {
    parts.push(
      'educación docente pedagogía enseñanza aprendizaje didáctica formación escuela universidad capacitación'
    );
  }
  if (
    lower.includes('ia') ||
    lower.includes('inteligencia artificial') ||
    lower.includes('machine learning') ||
    lower.includes('aprendizaje automático') ||
    lower.includes('algoritmo') ||
    lower.includes('modelo') ||
    lower.includes('python') ||
    lower.includes('scikit') ||
    lower.includes('tensorflow')
  ) {
    parts.push(
      'inteligencia artificial IA machine learning aprendizaje automático algoritmos modelos datos python scikit-learn tensorflow deep learning redes neuronales'
    );
  }
  if (
    lower.includes('drone') ||
    lower.includes('dron') ||
    lower.includes('vuelo') ||
    lower.includes('fotogrametría') ||
    lower.includes('aéreo') ||
    lower.includes('cartografía')
  ) {
    parts.push(
      'drones dron vuelo fotogrametría cartografía inspección aérea automatización sensores agricultura fotografía aérea'
    );
  }
  if (
    lower.includes('energía') ||
    lower.includes('solar') ||
    lower.includes('fotovoltaico') ||
    lower.includes('batería') ||
    lower.includes('panel')
  ) {
    parts.push(
      'energía solar fotovoltaica paneles baterías eficiencia energética almacenamiento renovables electricidad sistemas eléctricos'
    );
  }
  if (
    lower.includes('deporte') ||
    lower.includes('ejercicio') ||
    lower.includes('fisiología') ||
    lower.includes('nutrición') ||
    lower.includes('actividad física')
  ) {
    parts.push(
      'deporte ejercicio fisiología nutrición actividad física entrenamiento rendimiento humano salud deportiva'
    );
  }
  if (
    lower.includes('comunicación') ||
    lower.includes('competencias comunicativas') ||
    lower.includes('presentación') ||
    lower.includes('redactar') ||
    lower.includes('expresión')
  ) {
    parts.push(
      'comunicación competencias comunicativas expresión oral escrita presentaciones habilidades académicas profesionales textos públicos digitales'
    );
  }
  if (
    lower.includes('inglés') ||
    lower.includes('idioma') ||
    lower.includes('traducción') ||
    lower.includes('enseñanza de inglés')
  ) {
    parts.push(
      'inglés idioma enseñanza traducción comunicación internacional habilidades lingüísticas educación bilingüe'
    );
  }

  return parts.join(' | ');
}

async function getEmbedding(input: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ input, model: OPENAI_EMBEDDING_MODEL }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  const emb = json?.data?.[0]?.embedding;
  if (!Array.isArray(emb)) throw new Error('Embedding vacío');
  return emb;
}

async function main() {
  const args = parseArgs();
  const limit = typeof args.limit === 'string' ? Number(args.limit) : undefined;
  const dry = Boolean(args.dry);
  const concurrency =
    typeof args.concurrency === 'string'
      ? Math.max(1, Number(args.concurrency))
      : 2;
  const ids =
    typeof args.ids === 'string'
      ? args.ids
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n))
      : [];

  console.log('Regenerando embeddings...');
  console.log({
    limit,
    dry,
    concurrency,
    countIds: ids.length,
    model: OPENAI_EMBEDDING_MODEL,
  });

  let toProcess: { id: number; title: string; description: string | null }[] =
    [];

  if (ids.length > 0) {
    toProcess = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
      })
      .from(courses)
      .where(inArray(courses.id, ids));
  } else {
    toProcess = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
      })
      .from(courses)
      .limit(limit ?? Number.MAX_SAFE_INTEGER);
  }

  console.log(`Cursos a procesar: ${toProcess.length}`);
  if (toProcess.length === 0) {
    console.log('No hay cursos para procesar.');
    return;
  }

  let processed = 0;
  let ok = 0;
  let fail = 0;

  const queue = [...toProcess];
  const workers = Array.from({ length: concurrency }, () =>
    (async function worker() {
      while (queue.length > 0) {
        const c = queue.shift();
        if (!c) break;
        processed++;
        try {
          const text = buildCourseText({
            title: c.title,
            description: c.description,
          });
          if (!text.trim()) {
            console.warn(
              `[${processed}/${toProcess.length}] id=${c.id} -> texto vacío, se omite.`
            );
            continue;
          }
          if (dry) {
            console.log(`[DRY] id=${c.id} textLen=${text.length}`);
            ok++;
            continue;
          }
          const embedding = await getEmbedding(text);
          await db
            .update(courses)
            .set({ embedding })
            .where(eq(courses.id, c.id));
          ok++;
          console.log(`[OK ${ok}] id=${c.id}`);
          // respiro pequeño para no saturar
          await sleep(150);
        } catch (e) {
          fail++;
          console.error(`[FAIL ${fail}] id=${c.id}:`, (e as Error).message);
          await sleep(300);
        }
      }
    })()
  );

  await Promise.all(workers);
  console.log(`COMPLETADO: total=${toProcess.length} ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error('Error fatal:', e);
  process.exit(1);
});
