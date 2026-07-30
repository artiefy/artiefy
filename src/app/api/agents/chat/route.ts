import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { env } from '~/env';
import { getGuidedProjectById } from '~/server/actions/estudiantes/guided-projects/getGuidedProjectById';

interface AgentChatRequestBody {
  message?: unknown;
  projectId?: unknown;
  agent?: unknown;
  activityId?: unknown;
}

/**
 * Read at request time, never at module scope, so a value added to the
 * environment after the build is picked up without freezing as `undefined`.
 */
function readAgentsConfig() {
  return {
    webhookUrl: env.N8N_AGENTS_WEBHOOK_URL,
    authHeader: env.N8N_AGENTS_AUTH_HEADER,
    authValue: env.N8N_AGENTS_AUTH_VALUE,
  };
}

/**
 * Builds the plain-text context block handed to the Coach agent. The agent has
 * no database access, so this block is its only source of truth about the
 * project. Only enrolled learners ever reach this point.
 */
function buildProjectContext(
  project: Awaited<ReturnType<typeof getGuidedProjectById>>,
  activityId: number | null
): string {
  if (!project) return '';

  const lines: string[] = [`Proyecto guiado: ${project.title}`];

  if (project.subtitle) {
    lines.push(`Subtítulo: ${project.subtitle}`);
  }
  lines.push(`Progreso general: ${project.porcentajecompletado ?? 0}%`);
  lines.push('');
  lines.push('Objetivos y actividades:');

  let activeLabel: string | null = null;

  for (const objective of project.objectives ?? []) {
    const activities = objective.activities ?? [];
    const done = activities.filter((activity) => activity.isCompleted).length;
    lines.push(`- ${objective.title} (${done}/${activities.length})`);

    for (const activity of activities) {
      const isActive = activityId
        ? activity.id === activityId
        : !activity.isCompleted && !activeLabel;
      const state = activity.isCompleted
        ? 'completada'
        : isActive
          ? 'ACTIVA'
          : 'pendiente';

      if (isActive && !activeLabel) {
        activeLabel = `${objective.title} > ${activity.name}`;
      }

      lines.push(`  - ${activity.name} [${state}]`);

      if (isActive && activity.instructionText) {
        lines.push(`    Instrucciones: ${activity.instructionText}`);
      }
    }
  }

  if (activeLabel) {
    lines.push('');
    lines.push(`Actividad activa: ${activeLabel}`);
  }

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  const {
    webhookUrl: WEBHOOK_URL,
    authHeader: AUTH_HEADER,
    authValue: AUTH_VALUE,
  } = readAgentsConfig();

  if (!WEBHOOK_URL || !AUTH_HEADER || !AUTH_VALUE) {
    return NextResponse.json(
      {
        error:
          'El asistente no está configurado. Faltan N8N_AGENTS_WEBHOOK_URL, N8N_AGENTS_AUTH_HEADER o N8N_AGENTS_AUTH_VALUE.',
      },
      { status: 503 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let body: AgentChatRequestBody;
  try {
    body = (await request.json()) as AgentChatRequestBody;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json(
      { error: 'El mensaje no puede estar vacío' },
      { status: 400 }
    );
  }

  const agent =
    body.agent === 'coach' || body.agent === 'tutor' ? body.agent : 'artie';
  const projectId = Number(body.projectId);
  const activityId = Number(body.activityId);

  let context = '';
  let sessionId = `${userId}:artie`;

  if (Number.isFinite(projectId) && projectId > 0) {
    const project = await getGuidedProjectById(projectId, userId);

    // Enrollment gate: the agents only ever see projects the learner owns.
    if (!project?.enrolled) {
      return NextResponse.json(
        { error: 'No estás inscrito en este proyecto' },
        { status: 403 }
      );
    }

    context = buildProjectContext(
      project,
      Number.isFinite(activityId) && activityId > 0 ? activityId : null
    );
    sessionId = `${userId}:project:${projectId}`;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER]: AUTH_VALUE,
      },
      body: JSON.stringify({ message, sessionId, agent, context }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      console.error(
        `n8n agents webhook responded ${response.status}: ${await response.text()}`
      );
      return NextResponse.json(
        { error: 'El asistente no está disponible en este momento' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { reply?: string };
    const reply = typeof data.reply === 'string' ? data.reply : '';

    if (!reply) {
      return NextResponse.json(
        { error: 'El asistente respondió vacío' },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply, sessionId });
  } catch (error) {
    console.error('Error calling n8n agents webhook:', error);
    return NextResponse.json(
      { error: 'No pudimos contactar al asistente' },
      { status: 502 }
    );
  }
}
