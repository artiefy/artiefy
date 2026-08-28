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
import { courses, projects } from '~/server/db/schema';

interface AgentChatRequestBody {
  message?: unknown;
  agent?: unknown;
  projectId?: unknown;
  /** Set by the widget when the scope came from a user-owned project. */
  projectSource?: unknown;
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

/**
 * Tarjeta de bloqueo que el chat pinta en lugar del compositor. Tiene la misma
 * forma que la de cuota agotada, así el widget la renderiza sin ramas nuevas.
 */
interface AccessNotice {
  title: string;
  body: string;
  primary: { label: string; href: string } | null;
  secondary: { label: string; href: string } | null;
}

/**
 * Un muro cerrado no vende nada. Cada bloqueo explica qué falta y ofrece el
 * camino más corto para desbloquearlo, que casi siempre es Premium.
 */
function accessDenied(status: number, notice: AccessNotice) {
  return NextResponse.json({ error: notice.title, notice }, { status });
}

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

/**
 * Coach counterpart of `buildProjectContext`, for a project the learner
 * created directly on `/proyectos` (no course, no guided curriculum). Same
 * "only source of truth" rule applies: the agent never queries the database
 * itself.
 */
function buildUserProjectContext(project: {
  name: string;
  description: string | null;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
}): string {
  const lines = [`Proyecto: ${project.name}`];

  if (project.description) {
    lines.push(`Descripción: ${project.description}`);
  }
  if (project.planteamiento) {
    lines.push(`Planteamiento: ${project.planteamiento}`);
  }
  if (project.justificacion) {
    lines.push(`Justificación: ${project.justificacion}`);
  }
  if (project.objetivo_general) {
    lines.push(`Objetivo general: ${project.objetivo_general}`);
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
  // Set by the widget when the id came from a user-owned project scope, so a
  // colliding id in `guidedProjects` (independent serial sequence) is never
  // consulted for it. Absent (including every conversation saved before this
  // field existed) falls back to guided-first, same as today.
  const projectSource = body.projectSource === 'user' ? 'user' : undefined;
  // Tracks which table actually answered, so the n8n payload below can keep
  // sending `projectId` for guided projects only.
  let isUserProjectContext = false;

  // Both describe what the learner is enrolled in, so both are personal data
  // and always require a session.
  if ((hasProjectContext || hasCourseContext) && !userId) {
    return withAnonCookie(
      accessDenied(401, {
        title: 'Necesito saber quién eres',
        body: 'Para acompañarte con tu curso o tu proyecto tengo que ver tu progreso, y para eso necesitas una cuenta. Créala gratis y estrenas 10 días de Premium.',
        primary: { label: 'Crear cuenta gratis', href: '/sign-up' },
        secondary: { label: 'Ya tengo cuenta', href: '/sign-in' },
      })
    );
  }

  let context = '';
  let sessionId = userId ? `${userId}:artie` : `anon:${anonId}:artie`;

  if (hasProjectContext && userId) {
    // `projectSource: 'user'` short-circuits straight to the general table —
    // a request explicitly scoped to a user project never touches the
    // premium gate below, so it can never be mistaken for a guided one.
    const guidedProject =
      projectSource === 'user'
        ? null
        : await getGuidedProjectById(projectId, userId);

    if (guidedProject) {
      // Enrollment gate: the agents only ever see projects the learner owns.
      // Byte-identical to before the fallback branch below existed.
      if (!guidedProject.enrolled) {
        return accessDenied(403, {
          title: 'Este proyecto guiado es Premium',
          body: 'Los proyectos guiados vienen conmigo de mentor: te acompaño actividad por actividad hasta que lo termines. Necesitas un plan Pro o Premium activo para entrar.',
          primary: { label: 'Quiero Premium', href: '/planes' },
          secondary: {
            label: 'Ver el proyecto',
            href: `/estudiantes/proyectos-guiados/${projectId}`,
          },
        });
      }

      context = buildProjectContext(
        guidedProject,
        Number.isFinite(activityId) && activityId > 0 ? activityId : null
      );
      sessionId = `${userId}:project:${projectId}`;
    } else {
      // The id is absent from `guidedProjects` (or the scope already said
      // "user project"): fall back to the general table. `type` on that row
      // is descriptive only — ownership is the actual gate, same as every
      // other personal scope on this route.
      const userProject = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: {
          userId: true,
          name: true,
          description: true,
          planteamiento: true,
          justificacion: true,
          objetivo_general: true,
        },
      });

      if (!userProject || userProject.userId !== userId) {
        return accessDenied(403, {
          title: 'Este proyecto no es tuyo',
          body: 'Solo quien creó este proyecto puede hablar con el Coach sobre él.',
          primary: { label: 'Ver mis proyectos', href: '/proyectos' },
          secondary: null,
        });
      }

      isUserProjectContext = true;
      context = buildUserProjectContext(userProject);
      sessionId = `${userId}:userproject:${projectId}`;
    }
  } else if (hasCourseContext && userId) {
    // Same rule as projects: the agents only ever discuss courses the learner
    // actually has.
    if (!(await isUserEnrolled(courseId, userId))) {
      return accessDenied(403, {
        title: 'Todavía no estás en este curso',
        body: 'Puedo resolverte lo que quieras del contenido de este curso, pero primero tienes que estar inscrito. Con Premium entras a todos sin pagarlos uno por uno.',
        primary: { label: 'Quiero Premium', href: '/planes' },
        secondary: {
          label: 'Ver el curso',
          href: `/estudiantes/cursos/${courseId}`,
        },
      });
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
        // User projects have no document in the RAG store to collide with a
        // guided one under the same numeric id, so they never reach it.
        projectId:
          hasProjectContext && !isUserProjectContext ? projectId : null,
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
