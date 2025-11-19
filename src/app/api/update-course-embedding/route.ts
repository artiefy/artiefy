import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

interface OpenAIEmbeddingResponse {
  data: { embedding: number[] }[];
}

interface RequestBody {
  courseId: number;
}

function buildCourseText(course: {
  title: string;
  description?: string | null;
  area?: string | null;
  tags?: string[] | null;
}) {
  const parts: string[] = [];
  if (course.title) parts.push(course.title);
  if (course.description) parts.push(course.description);
  // Boost manual para dominios clave y temas IA/machine learning/drones/energía/deporte/comunicación/inglés
  const lower = (course.title + ' ' + (course.description ?? '')).toLowerCase();
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

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no configurada' },
        { status: 400 }
      );
    }
    const { courseId }: RequestBody = await req.json();
    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      );
    }
    // 1. Traer el curso de la BD
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }
    const text = buildCourseText({
      title: course.title,
      description: course.description,
    });
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Texto vacío para embedding' },
        { status: 400 }
      );
    }
    // 2. Generar embedding
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: OPENAI_EMBEDDING_MODEL,
      }),
    });
    if (!embeddingRes.ok) {
      const errText = await embeddingRes.text().catch(() => '');
      return NextResponse.json(
        { error: 'No se pudo generar el embedding', details: errText },
        { status: 500 }
      );
    }
    const embeddingData: OpenAIEmbeddingResponse = await embeddingRes.json();
    const embedding = embeddingData?.data?.[0]?.embedding;
    if (!embedding) {
      return NextResponse.json({ error: 'Embedding vacío' }, { status: 500 });
    }
    // 3. Guardar embedding
    await db.update(courses).set({ embedding }).where(eq(courses.id, courseId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error actualizando el embedding:', err);
    return NextResponse.json(
      { error: 'Error actualizando el embedding' },
      { status: 500 }
    );
  }
}
