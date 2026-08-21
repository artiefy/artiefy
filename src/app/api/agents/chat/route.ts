import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { env } from '~/env';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { getGuidedProjectById } from '~/server/actions/estudiantes/guided-projects/getGuidedProjectById';
import {
  type AgentQuotaState,
  consumeAgentQuota,
  refundAgentQuota,
  resolveAgentQuotaTier,
} from '~/server/agents/agentChatQuota';
import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

interface AgentChatRequestBody {
  message?: unknown;
  agent?: unknown;
  projectId?: unknown;
  courseId?: unknown;
  activityId?: unknown;
}

/** Specialists the orchestrator can hand a message to. */
const AGENT_IDS = ['artie', 'tutor', 'coach'] as const;
type AgentId = (typeof AGENT_IDS)[number];

const isAgentId = (value: unknown): value is AgentId =>
  typeof value === 'string' && AGENT_IDS.includes(value as AgentId);

/** Identifies an anonymous visitor so their free allowance can be tracked. */
const ANON_COOKIE = 'artiefy_agent_anon';
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function toQuotaPayload(state: AgentQuotaState) {
  return {
    tier: state.tier,
    limit: state.limit,
    remaining: state.remaining,
    resetsDaily: state.resetsDaily,
  };
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

/**
 * Course counterpart of `buildProjectContext`. Deliberately thin: it only
 * names the course the learner asked about, which is enough for the agent to
 * stay on topic. The course material itself reaches the agent through the
 * retrieval step in the n8n workflow, not through this block.
 */
async function buildCourseContext(courseId: number): Promise<string> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    columns: { title: true, description: true },
  });

  if (!course) return '';

  const lines = [`Curso: ${course.title}`];
  if (course.description) {
    lines.push(`Descripción: ${course.description}`);
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

  // Anonymous visitors get their own allowance, tracked with a long-lived
  // cookie. Clearing cookies resets it — this is a funnel gate, not a hard
  // security boundary.
  const existingAnonId = request.cookies.get(ANON_COOKIE)?.value;
  const anonId = userId
    ? null
    : existingAnonId && UUID_PATTERN.test(existingAnonId)
      ? existingAnonId
      : crypto.randomUUID();

  const withAnonCookie = (response: NextResponse) => {
    if (anonId) {
      response.cookies.set(ANON_COOKIE, anonId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: request.nextUrl.protocol === 'https:',
        path: '/',
        maxAge: ANON_COOKIE_MAX_AGE,
      });
    }
    return response;
  };

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

  // Manual pick from the header switcher. It is a preference, not an order:
  // the orchestrator still routes on its own when the ask clearly belongs to
  // someone else.
  const requestedAgent: AgentId = isAgentId(body.agent) ? body.agent : 'artie';

  const projectId = Number(body.projectId);
  const courseId = Number(body.courseId);
  const activityId = Number(body.activityId);
  const hasProjectContext = Number.isFinite(projectId) && projectId > 0;
  // A project always wins: a conversation is about one subject at a time.
  const hasCourseContext =
    !hasProjectContext && Number.isFinite(courseId) && courseId > 0;

  // Both describe what the learner is enrolled in, so both are personal data
  // and always require a session.
  if ((hasProjectContext || hasCourseContext) && !userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let context = '';
  let sessionId = userId ? `${userId}:artie` : `anon:${anonId}:artie`;

  if (hasProjectContext && userId) {
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
  } else if (hasCourseContext && userId) {
    // Same rule as projects: the agents only ever discuss courses the learner
    // actually has.
    if (!(await isUserEnrolled(courseId, userId))) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 403 }
      );
    }

    context = await buildCourseContext(courseId);
    // Its own thread, so course questions never bleed into the general chat.
    sessionId = `${userId}:course:${courseId}`;
  }

  // Plan metadata is not in the session token yet, so it is read from Clerk.
  const tier = userId
    ? resolveAgentQuotaTier((await currentUser())?.publicMetadata)
    : 'anon';

  const quota = await consumeAgentQuota(tier, userId ?? anonId!);

  if (!quota.allowed) {
    return withAnonCookie(
      NextResponse.json(
        {
          error: 'Alcanzaste el límite de mensajes con el asistente',
          quota: toQuotaPayload(quota),
        },
        { status: 429 }
      )
    );
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER]: AUTH_VALUE,
      },
      // No agent is requested: the orchestrator picks the specialist from what
      // the learner is asking for, and reports back which one answered.
      // `courseId`/`projectId` are the retrieval scope: they tell the workflow
      // which documents its RAG step may read. Both null is a general question.
      body: JSON.stringify({
        message,
        sessionId,
        context,
        agent: requestedAgent,
        courseId: hasCourseContext ? courseId : null,
        projectId: hasProjectContext ? projectId : null,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      console.error(
        `n8n agents webhook responded ${response.status}: ${await response.text()}`
      );
      // The attempt never reached the agent, so it should not be charged.
      await refundAgentQuota(quota.key);
      return NextResponse.json(
        { error: 'El asistente no está disponible en este momento' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { reply?: string; agent?: string };
    const reply = typeof data.reply === 'string' ? data.reply : '';

    if (!reply) {
      await refundAgentQuota(quota.key);
      return NextResponse.json(
        { error: 'El asistente respondió vacío' },
        { status: 502 }
      );
    }

    // Falls back to the orchestrator itself when the workflow answered without
    // delegating, so the client always gets a valid agent to display.
    const agent: AgentId = isAgentId(data.agent) ? data.agent : 'artie';

    return withAnonCookie(
      NextResponse.json({
        reply,
        agent,
        sessionId,
        quota: toQuotaPayload(quota),
      })
    );
  } catch (error) {
    console.error('Error calling n8n agents webhook:', error);
    await refundAgentQuota(quota.key);
    return NextResponse.json(
      { error: 'No pudimos contactar al asistente' },
      { status: 502 }
    );
  }
}
