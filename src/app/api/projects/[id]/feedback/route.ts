import { NextRequest, NextResponse } from 'next/server';

import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import {
  projectFeedback,
  projects,
  projectsTaken,
  users,
} from '~/server/db/schema';
import { getApiSession } from '~/server/utils/apiAuth';

import type { Roles } from '~/types/globals';

const MAX_CONTENT_LENGTH = 2000;

// Solo estos roles pueden abrir un hilo de retroalimentación (comentario
// raíz). NOTA: `admin` queda deliberadamente fuera — el usuario pidió
// exactamente "educador y super-admin". Este es el único punto que hay que
// tocar si esa decisión cambia.
const ROOT_FEEDBACK_ROLES: readonly Roles[] = ['educador', 'super-admin'];

// Roles de staff que pueden responder en cualquier proyecto además del
// dueño/colaboradores. NOTA: `admin` también queda fuera de esta lista por
// pedido explícito (a diferencia del permiso de lectura, que sí lo incluye).
const REPLY_STAFF_ROLES: readonly Roles[] = ['educador', 'super-admin'];

const createFeedbackSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
  parentId: z.coerce.number().int().positive().optional(),
});

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

interface ProjectAccess {
  project: { id: number; ownerId: string } | null;
  isOwner: boolean;
  isCollaborator: boolean;
}

async function resolveProjectAccess(
  projectId: number,
  userId: string
): Promise<ProjectAccess> {
  const [project] = await db
    .select({ id: projects.id, ownerId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return { project: null, isOwner: false, isCollaborator: false };
  }

  const isOwner = project.ownerId === userId;
  let isCollaborator = false;
  if (!isOwner) {
    const [taken] = await db
      .select({ id: projectsTaken.id })
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.projectId, projectId),
          eq(projectsTaken.userId, userId)
        )
      )
      .limit(1);
    isCollaborator = Boolean(taken);
  }

  return { project, isOwner, isCollaborator };
}

interface FeedbackAuthor {
  id: string;
  name: string;
  role: Roles;
}

interface FeedbackItem {
  id: number;
  parentId: number | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: FeedbackAuthor;
}

// GET /api/projects/[id]/feedback — devuelve el árbol completo de
// retroalimentación (hilos raíz + respuestas) de un proyecto. Lectura
// restringida al dueño, sus colaboradores y staff (educador/admin/
// super-admin): la retroalimentación no es pública.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession();
    if (!session.userId) return respond({ error: 'No autorizado' }, 401);

    const { id } = await context.params;
    const projectId = Number(id);
    if (!Number.isFinite(projectId)) {
      return respond({ error: 'ID de proyecto inválido' }, 400);
    }

    const { project, isOwner, isCollaborator } = await resolveProjectAccess(
      projectId,
      session.userId
    );
    if (!project) return respond({ error: 'Proyecto no encontrado' }, 404);

    const canRead = isOwner || isCollaborator || session.isStaff;
    if (!canRead) {
      return respond(
        { error: 'No tienes permiso para ver esta retroalimentación' },
        403
      );
    }

    // Orden cronológico ascendente: permite construir cada hilo con sus
    // respuestas ya en orden de lectura (más antigua primero), sin un
    // segundo sort. Las raíces se reordenan luego más nueva primero.
    const rows = await db
      .select({
        id: projectFeedback.id,
        parentId: projectFeedback.parentId,
        content: projectFeedback.content,
        authorRole: projectFeedback.authorRole,
        createdAt: projectFeedback.createdAt,
        updatedAt: projectFeedback.updatedAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
      })
      .from(projectFeedback)
      .innerJoin(users, eq(projectFeedback.userId, users.id))
      .where(eq(projectFeedback.projectId, projectId))
      .orderBy(asc(projectFeedback.createdAt));

    const roots = new Map<number, FeedbackItem & { replies: FeedbackItem[] }>();
    const repliesByParent = new Map<number, FeedbackItem[]>();

    for (const row of rows) {
      const item: FeedbackItem = {
        id: row.id,
        parentId: row.parentId,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        author: {
          id: row.userId,
          name: row.userName?.trim() || row.userEmail,
          role: row.authorRole,
        },
      };

      if (row.parentId === null) {
        roots.set(row.id, { ...item, replies: [] });
      } else {
        const list = repliesByParent.get(row.parentId) ?? [];
        list.push(item);
        repliesByParent.set(row.parentId, list);
      }
    }

    const threads = [...roots.values()]
      .map((root) => ({
        ...root,
        replies: repliesByParent.get(root.id) ?? [],
      }))
      // Hilos más recientes primero: es un log de retroalimentación, igual
      // que el feed social del proyecto (comentarios), así el equipo ve de
      // inmediato la observación más nueva sin desplazarse.
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return respond({ items: threads });
  } catch (error) {
    console.error('Error GET /api/projects/[id]/feedback', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}

// POST /api/projects/[id]/feedback — crea un hilo raíz o una respuesta.
// Permisos (nunca confiar en el cliente):
// - Hilo raíz: solo ROOT_FEEDBACK_ROLES (educador, super-admin).
// - Respuesta: dueño del proyecto, cualquier colaborador (projectsTaken), o
//   REPLY_STAFF_ROLES (educador, super-admin).
// Profundidad máxima 2 (raíz + respuestas, estilo YouTube): si `parentId`
// apunta a una respuesta (tiene su propio parentId), el nuevo mensaje se
// re-asocia a la raíz de esa respuesta en vez de anidarse más.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession();
    if (!session.userId) return respond({ error: 'No autorizado' }, 401);

    const { id } = await context.params;
    const projectId = Number(id);
    if (!Number.isFinite(projectId)) {
      return respond({ error: 'ID de proyecto inválido' }, 400);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return respond({ error: 'JSON inválido' }, 400);
    }

    const parsed = createFeedbackSchema.safeParse(rawBody);
    if (!parsed.success) {
      return respond(
        { error: 'Datos inválidos', issues: parsed.error.issues },
        400
      );
    }
    const { content, parentId } = parsed.data;

    const { project, isOwner, isCollaborator } = await resolveProjectAccess(
      projectId,
      session.userId
    );
    if (!project) return respond({ error: 'Proyecto no encontrado' }, 404);

    let effectiveParentId: number | null = null;
    if (parentId !== undefined) {
      const [parent] = await db
        .select({
          id: projectFeedback.id,
          projectId: projectFeedback.projectId,
          parentId: projectFeedback.parentId,
        })
        .from(projectFeedback)
        .where(eq(projectFeedback.id, parentId))
        .limit(1);

      if (!parent) {
        return respond(
          { error: 'El comentario al que respondes no existe' },
          400
        );
      }
      if (parent.projectId !== projectId) {
        return respond(
          {
            error: 'El comentario al que respondes pertenece a otro proyecto',
          },
          400
        );
      }

      // Cap de profundidad: si el padre ya es una respuesta, el nuevo
      // mensaje se cuelga de la raíz de ese padre en vez de anidarse más.
      effectiveParentId = parent.parentId ?? parent.id;
    }

    const role = session.role;

    if (effectiveParentId === null) {
      if (!role || !ROOT_FEEDBACK_ROLES.includes(role)) {
        return respond(
          {
            error:
              'Solo un educador puede iniciar un hilo de retroalimentación',
          },
          403
        );
      }
    } else {
      const canReply =
        isOwner ||
        isCollaborator ||
        (role !== undefined && REPLY_STAFF_ROLES.includes(role));
      if (!canReply) {
        return respond(
          { error: 'No tienes permiso para responder en este proyecto' },
          403
        );
      }
    }

    // El chequeo anterior garantiza que `role` está definido cuando llegamos
    // aquí (rechaza antes con 403 si no lo está), salvo el caso
    // dueño/colaborador con un rol no resuelto; el fallback deja el insert
    // type-safe sin cambiar el comportamiento observable.
    const authorRole: Roles = role ?? 'estudiante';

    const [created] = await db
      .insert(projectFeedback)
      .values({
        projectId,
        parentId: effectiveParentId,
        userId: session.userId,
        authorRole,
        content,
      })
      .returning();

    if (!created) {
      return respond({ error: 'No se pudo crear la retroalimentación' }, 500);
    }

    const [author] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    return respond(
      {
        feedback: {
          id: created.id,
          parentId: created.parentId,
          content: created.content,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          author: {
            id: author?.id ?? session.userId,
            name: author?.name?.trim() || author?.email || 'Usuario',
            role: authorRole,
          },
        },
      },
      201
    );
  } catch (error) {
    console.error('Error POST /api/projects/[id]/feedback', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
