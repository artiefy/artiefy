'use client';

import { showProjectGenerationToast } from '~/components/projects/ProjectGenerationToast';
import {
  type GenerateContentOptions,
  requestGeneratedContent,
} from '~/hooks/useGenerateContent';
import { openCoachChatForGeneratedProject } from '~/lib/agents/agentChatBus';
import { rememberProjectMode } from '~/lib/agents/projectMode';
import {
  AI_MODE_DESCRIPTION_GUIDE,
  cleanGeneratedTitle,
  dedupeRequirements,
  normalizeRequirementLine,
} from '~/lib/projects/projectAiText';

import type { ProjectAiSeed } from '~/components/projects/Modals/ProjectModeChooser';

interface GenerateProjectOptions {
  seed: ProjectAiSeed;
  /** Set when the project is created from a course page. */
  courseId?: number;
  /** Runs once the project row exists, e.g. to refresh a project list. */
  onCreated?: (projectId: number) => void;
}

interface GeneratedObjective {
  title: string;
  activities: string[];
}

interface Category {
  id: number;
  name: string;
  description?: string | null;
}

/** The wizard's own default for a project a single learner owns. */
const PROJECT_TYPE = 'Individual';
const MAX_OBJECTIVES = 5;
const MAX_ACTIVITIES_PER_OBJECTIVE = 4;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeText = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** One field; an empty string means the generator failed for it. */
async function generateField(options: GenerateContentOptions) {
  try {
    return (await requestGeneratedContent(options)).trim();
  } catch (error) {
    console.error(`[project generation] ${options.type} failed:`, error);
    return '';
  }
}

/**
 * Picks the category whose name (and, more weakly, description) shares the
 * most words with the project. Deterministic on purpose: the n8n generator
 * only knows how to write text fields, not how to choose from a list.
 */
async function pickCategoryId(text: string): Promise<number | undefined> {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) return undefined;
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) return undefined;

    const categories = data.filter(
      (item): item is Category =>
        isRecord(item) &&
        typeof item.id === 'number' &&
        typeof item.name === 'string'
    );
    if (categories.length === 0) return undefined;

    const haystack = normalizeText(text);
    const wordsOf = (value: string) =>
      new Set(
        normalizeText(value)
          .split(/[^a-z0-9]+/)
          .filter((word) => word.length > 3)
      );

    let best = categories[0]!;
    let bestScore = 0;
    for (const category of categories) {
      let score = 0;
      for (const word of wordsOf(category.name)) {
        if (haystack.includes(word)) score += 2;
      }
      for (const word of wordsOf(category.description ?? '')) {
        if (haystack.includes(word)) score += 1;
      }
      if (score > bestScore) {
        best = category;
        bestScore = score;
      }
    }
    return best.id;
  } catch {
    return undefined;
  }
}

function extractJson(content: string): unknown {
  const start = content.search(/[[{]/);
  if (start === -1) return null;
  const end = Math.max(content.lastIndexOf('}'), content.lastIndexOf(']'));
  if (end <= start) return null;
  try {
    return JSON.parse(content.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!isRecord(value)) return '';
  for (const key of ['title', 'description', 'name', 'objetivo']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

function objectivesFromJson(payload: unknown): GeneratedObjective[] {
  const list = Array.isArray(payload)
    ? payload
    : isRecord(payload)
      ? (payload.objetivos ??
        payload.objetivosEsp ??
        payload.objetivos_especificos)
      : null;
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      const rawActivities = isRecord(item)
        ? (item.activities ?? item.actividades)
        : null;
      return {
        title: textOf(item),
        activities: Array.isArray(rawActivities)
          ? rawActivities.map(textOf).filter(Boolean)
          : [],
      };
    })
    .filter((objective) => objective.title);
}

/**
 * Reads the generator's objectives, which come back either as the JSON the
 * prompt asks for or flattened by `requestGeneratedContent` into
 * "Objetivo 1: …" / "Actividad: …" lines.
 */
function parseObjectives(content: string): GeneratedObjective[] {
  const fromJson = objectivesFromJson(extractJson(content));
  const objectives: GeneratedObjective[] = fromJson.length ? fromJson : [];

  if (objectives.length === 0) {
    let current: GeneratedObjective | null = null;
    for (const rawLine of content.split('\n')) {
      const line = rawLine.replace(/^[-*•\s]+/u, '').trim();
      if (!line) continue;

      const activity = /^(?:actividad|tarea)\s*\d*\s*[:.)-]?\s*(.+)$/iu.exec(
        line
      );
      if (activity) {
        current?.activities.push(activity[1]!.trim());
        continue;
      }

      const objective = /^objetivo\s*\d*\s*[:.)-]?\s*(.+)$/iu.exec(line);
      if (objective) {
        current = { title: objective[1]!.trim(), activities: [] };
        objectives.push(current);
      }
    }
  }

  return objectives.slice(0, MAX_OBJECTIVES).map((objective) => ({
    title: objective.title,
    activities: objective.activities.slice(0, MAX_ACTIVITIES_PER_OBJECTIVE),
  }));
}

/**
 * Builds a whole project from the mode chooser's idea without keeping any
 * screen open: every step runs here, outside React, and reports into one
 * corner toast. Once saved, the Coach opens on it in a fresh conversation
 * whose greeting and behaviour follow the chosen mode.
 *
 * Guided leaves the objectives for the learner to write with the Coach;
 * Copilot also drafts the objectives and their activities.
 */
export async function generateProjectFromIdea(
  options: GenerateProjectOptions
): Promise<void> {
  const { seed, courseId, onCreated } = options;
  const mode = seed.mode === 'copilot' ? 'copilot' : 'guided';
  const draftsObjectives = mode === 'copilot';
  const toastId = `project-generation-${Date.now()}`;

  // Title, description, problem, justification, general objective,
  // requirements and the save itself; Copilot adds the objectives.
  const totalSteps = draftsObjectives ? 8 : 7;
  let doneSteps = 0;
  let label = 'Pensando un buen título…';

  const report = () =>
    showProjectGenerationToast(toastId, {
      status: 'running',
      label,
      progress: Math.max(4, Math.round((doneSteps / totalSteps) * 100)),
    });
  const advance = () => {
    doneSteps += 1;
    report();
  };

  report();

  const ideaContext = seed.details
    ? `Idea: "${seed.idea}". Detalles: "${seed.details}".`
    : `Idea: "${seed.idea}".`;

  // Categories do not depend on the AI, so they load while it writes.
  const categoryPromise = pickCategoryId(`${seed.idea} ${seed.details}`);

  const rawTitle = await generateField({
    type: 'titulo',
    prompt: `${ideaContext} Genera un título claro, atractivo y profesional (máximo 8 palabras) para un proyecto estudiantil basado en esta idea. Solo responde con el título, sin comillas ni explicaciones.`,
    existingText: seed.idea,
    titulo: seed.idea,
    descripcion: seed.details,
  });
  const title = (rawTitle && cleanGeneratedTitle(rawTitle)) || seed.idea;
  label = 'Escribiendo la descripción…';
  advance();

  const description =
    (await generateField({
      type: 'descripcion',
      prompt: `Genera una descripción BREVE (120-150 palabras, un párrafo) para un proyecto estudiantil titulado "${title}". ${ideaContext} ${AI_MODE_DESCRIPTION_GUIDE[mode]} Describe desde la perspectiva del ESTUDIANTE: qué problema va a resolver, qué va a crear, qué habilidades aplicará y quién se beneficiará. Usa lenguaje directo y motivador. Solo responde con la descripción, sin títulos.`,
      titulo: title,
      descripcion: seed.details,
    })) ||
    seed.details ||
    seed.idea;
  label = draftsObjectives
    ? 'Definiendo el problema, los objetivos y las actividades…'
    : 'Definiendo el problema, la justificación y el objetivo general…';
  advance();

  const context = `Título: ${title}\nDescripción: ${description}`;
  const fieldBase = { titulo: title, descripcion: description };
  const tracked = <T>(promise: Promise<T>) =>
    promise.then((value) => {
      advance();
      return value;
    });

  // Independent of each other: run together so the wait is one call long.
  const [
    planteamiento,
    justificacion,
    objetivoGeneral,
    requirementsText,
    objectivesText,
  ] = await Promise.all([
    tracked(
      generateField({
        ...fieldBase,
        type: 'problema',
        prompt: `Genera un problema claro y conciso para un proyecto educativo. Contexto del proyecto: "${context}". Responde solo con el problema.`,
      })
    ),
    tracked(
      generateField({
        ...fieldBase,
        type: 'justificacion',
        prompt: `Redacta la justificación de este proyecto estudiantil en un párrafo de 80 a 120 palabras: por qué es importante y a quién beneficia.\n\n${context}\n\nResponde solo con la justificación.`,
      })
    ),
    tracked(
      generateField({
        ...fieldBase,
        type: 'objetivoGen',
        prompt: `Redacta el objetivo general de este proyecto estudiantil en una sola oración que empiece con un verbo en infinitivo.\n\n${context}\n\nResponde solo con el objetivo general.`,
      })
    ),
    tracked(
      generateField({
        ...fieldBase,
        type: 'requisitos',
        prompt: `Genera una lista de requisitos tecnicos y funcionales para un proyecto educativo, basandote en el contexto.\n\n${context}\n\nResponde solo con la lista de requisitos, uno por linea.`,
      })
    ),
    draftsObjectives
      ? tracked(
          generateField({
            ...fieldBase,
            type: 'objetivosEsp',
            prompt: `Genera entre 3 y 5 objetivos especificos para este proyecto y, para cada objetivo, 2 a 3 actividades claras y medibles.\n\n${context}\n\nDevuelve SOLO JSON válido con este formato:\n{"objetivos":[{"title":"Objetivo 1","activities":[{"title":"Actividad 1"}]}]}`,
          })
        )
      : Promise.resolve(''),
  ]);

  const requirements = dedupeRequirements(
    requirementsText.split('\n').map(normalizeRequirementLine).filter(Boolean)
  );
  const objectives = objectivesText ? parseObjectives(objectivesText) : [];
  const categoryId = await categoryPromise;

  label = 'Guardando tu proyecto…';
  report();

  // A field the AI could not write stays empty: the lenient draft save keeps
  // the project instead of failing it, and the learner fills the gap later.
  const isComplete = Boolean(
    planteamiento && justificacion && objetivoGeneral && categoryId
  );

  let projectId: number | undefined;
  try {
    const response = await fetch(
      isComplete ? '/api/projects' : '/api/projects?draft=true',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          description,
          planteamiento,
          justificacion,
          objetivo_general: objetivoGeneral,
          requirements: JSON.stringify(requirements),
          type_project: PROJECT_TYPE,
          categoryId,
          courseId,
          objetivos_especificos: objectives.map((objective, index) => ({
            id: `generated_${index}`,
            title: objective.title,
            activities: objective.activities,
          })),
        }),
      }
    );

    if (!response.ok) {
      showProjectGenerationToast(toastId, {
        status: 'error',
        message:
          response.status === 401
            ? 'Inicia sesión para crear tu proyecto.'
            : 'No se pudo guardar. Inténtalo de nuevo.',
        onRetry:
          response.status === 401
            ? undefined
            : () => void generateProjectFromIdea(options),
      });
      return;
    }

    const data = (await response.json()) as { id?: unknown };
    projectId = typeof data.id === 'number' ? data.id : undefined;
  } catch (error) {
    console.error('[project generation] save failed:', error);
  }

  if (!projectId) {
    showProjectGenerationToast(toastId, {
      status: 'error',
      message: 'No se pudo guardar. Inténtalo de nuevo.',
      onRetry: () => void generateProjectFromIdea(options),
    });
    return;
  }

  showProjectGenerationToast(toastId, { status: 'done', title });
  rememberProjectMode(projectId, mode);
  onCreated?.(projectId);

  openCoachChatForGeneratedProject({
    id: projectId,
    title,
    mode,
    hasObjectives: objectives.length > 0,
    href: courseId
      ? `/estudiantes/cursos/${courseId}?projectId=${projectId}&view=projects`
      : `/estudiantes/proyectos/${projectId}`,
  });
}
