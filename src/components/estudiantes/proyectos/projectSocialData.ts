import { clerkClient } from '@clerk/nextjs/server';
import { and, count, desc, eq, isNull, or, sql } from 'drizzle-orm';

import { getProjectById } from '~/server/actions/project/getProjectById';
import getPublicProjects from '~/server/actions/project/getPublicProjects';
import { db } from '~/server/db';
import {
  categories,
  communityPostComments,
  communityPosts,
  projects,
  projectsTaken,
  users,
} from '~/server/db/schema';

import type {
  CommunityFeedPost,
  ProjectSocialCollaborator,
  ProjectSocialItem,
} from './types';

import 'server-only';

type PublicProjectRecord = {
  id: number;
  name?: string | null;
  planteamiento?: string | null;
  justificacion?: string | null;
  objetivo_general?: string | null;
  requirements?: string | null;
  type_project?: string | null;
  isPublic?: boolean | null;
  needsCollaborators?: boolean | null;
  createdAt?: string | Date | null;
  coverImageKey?: string | null;
  coverVideoKey?: string | null;
  courseId?: number | null;
  userId?: string | null;
  user?: { id?: string; name?: string | null; email?: string | null };
  category?: { id?: number; name?: string | null };
  objetivosEsp?: string[] | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
};

type UserProjectRow = {
  id: number;
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  requirements: string | null;
  type_project: string;
  isPublic: boolean;
  needsCollaborators: boolean;
  createdAt: Date;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  userId: string;
  courseId: number | null;
  categoryId: number;
  categoryName: string | null;
  ownerName: string | null;
  ownerEmail: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

export interface ProjectSocialCollections {
  exploreItems: ProjectSocialItem[];
  myItems: ProjectSocialItem[];
  collaborationItems: ProjectSocialItem[];
  collaboratorItems: ProjectSocialCollaborator[];
}

const toStage = (typeProject?: string | null): ProjectSocialItem['stage'] => {
  const normalized = (typeProject ?? '').toLowerCase().trim();
  if (normalized.includes('idea')) return 'Idea';
  if (normalized.includes('lanz')) return 'Lanzado';
  if (normalized.includes('mvp')) return 'MVP';
  return 'En progreso';
};

const toCoverImageUrl = (coverImageKey?: string | null) => {
  if (!coverImageKey) return undefined;
  if (coverImageKey.startsWith('http')) {
    return `/api/image-proxy?url=${encodeURIComponent(coverImageKey)}`;
  }
  if (coverImageKey.startsWith('/')) return coverImageKey;

  const bucketBase = process.env.NEXT_PUBLIC_AWS_S3_URL;
  if (!bucketBase) return undefined;
  const sourceUrl = `${bucketBase}/${coverImageKey}`;
  return `/api/image-proxy?url=${encodeURIComponent(sourceUrl)}`;
};

// Community post author avatars come from `users.profileImageKey`, the same
// S3 key convention `toCoverImageUrl` handles above, but returned as a direct
// bucket URL (not proxied) — matching the precedent already established by
// `src/app/api/projects/[id]/comments/route.ts`'s `toAvatarUrl`, whose output
// `ProjectFeedCard.tsx` already renders straight into `next/image` with no
// proxy needed.
const toAvatarUrl = (profileImageKey?: string | null) => {
  if (!profileImageKey) return undefined;
  if (profileImageKey.startsWith('http')) return profileImageKey;
  const bucketBase = process.env.NEXT_PUBLIC_AWS_S3_URL;
  if (!bucketBase) return undefined;
  return `${bucketBase}/${profileImageKey}`;
};

const toDateString = (value?: string | Date | null) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : value;
};

const hasRequirements = (requirements?: string | null) => {
  if (!requirements) return false;
  try {
    const parsed = JSON.parse(requirements) as unknown;
    return Array.isArray(parsed) && parsed.some((item) => item?.trim?.());
  } catch {
    return false;
  }
};

const estimateProgress = (project: {
  name?: string | null;
  planteamiento?: string | null;
  justificacion?: string | null;
  objetivo_general?: string | null;
  requirements?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}) => {
  const completed = [
    Boolean(project.name?.trim() && project.planteamiento?.trim()),
    Boolean(project.planteamiento?.trim() && project.justificacion?.trim()),
    Boolean(project.objetivo_general?.trim()),
    hasRequirements(project.requirements),
    Boolean(project.fecha_inicio && project.fecha_fin),
  ].filter(Boolean).length;

  return Math.round((completed / 5) * 100);
};

const mapToSocialItem = (
  project: PublicProjectRecord,
  opts?: {
    viewerId?: string | null;
    ownerId?: string | null;
    ownerName?: string | null;
    ownerEmail?: string | null;
    isCollaborator?: boolean;
  }
): ProjectSocialItem => {
  const description =
    project.planteamiento?.trim() ??
    project.justificacion?.trim() ??
    project.objetivo_general?.trim() ??
    'Proyecto de la comunidad Artiefy';

  const ownerId =
    opts?.ownerId ?? project.user?.id ?? project.userId ?? undefined;
  const ownerName =
    opts?.ownerName ?? project.user?.name ?? 'Comunidad Artiefy';
  const ownerEmail = opts?.ownerEmail ?? project.user?.email ?? undefined;
  const progressPercentage = estimateProgress(project);

  return {
    id: project.id,
    title: (project.name ?? 'Proyecto sin título').trim(),
    description,
    stage: toStage(project.type_project),
    tags: [
      ...(Array.isArray(project.objetivosEsp)
        ? project.objetivosEsp.slice(0, 2)
        : []),
      project.category?.name ?? 'Innovación',
    ].filter(Boolean),
    category: {
      id: project.category?.id,
      name: project.category?.name?.trim() || 'Sin categoría',
    },
    author: {
      id: ownerId,
      name: ownerName?.trim() || 'Comunidad Artiefy',
      email: ownerEmail ?? undefined,
    },
    isPublic: Boolean(project.isPublic),
    needsCollaborators: Boolean(project.needsCollaborators),
    createdAt: toDateString(project.createdAt),
    coverImageUrl: toCoverImageUrl(project.coverImageKey),
    coverImageKey: project.coverImageKey ?? null,
    coverVideoKey: project.coverVideoKey ?? null,
    likes: 0,
    comments: 0,
    saves: 0,
    courseId: project.courseId ?? null,
    ownerId: ownerId ?? undefined,
    isOwner: Boolean(opts?.viewerId && ownerId === opts.viewerId),
    isCollaborator: Boolean(opts?.isCollaborator),
    categoryId: project.category?.id,
    typeProject: project.type_project,
    planteamiento: project.planteamiento ?? null,
    justificacion: project.justificacion ?? null,
    objetivoGeneral: project.objetivo_general ?? null,
    requirements: project.requirements ?? null,
    fechaInicio: project.fecha_inicio ?? null,
    fechaFin: project.fecha_fin ?? null,
    progressPercentage,
  };
};

const mapUserRowToRecord = (row: UserProjectRow): PublicProjectRecord => ({
  id: row.id,
  name: row.name,
  planteamiento: row.planteamiento,
  justificacion: row.justificacion,
  objetivo_general: row.objetivo_general,
  requirements: row.requirements,
  type_project: row.type_project,
  isPublic: row.isPublic,
  needsCollaborators: row.needsCollaborators,
  createdAt: row.createdAt,
  coverImageKey: row.coverImageKey,
  coverVideoKey: row.coverVideoKey,
  courseId: row.courseId,
  userId: row.userId,
  category: {
    id: row.categoryId,
    name: row.categoryName ?? 'Sin categoría',
  },
  fecha_inicio: row.fecha_inicio,
  fecha_fin: row.fecha_fin,
});

const enrichCollaboratorsWithClerk = async (
  collaborators: ProjectSocialCollaborator[]
): Promise<ProjectSocialCollaborator[]> => {
  if (collaborators.length === 0) return collaborators;

  try {
    const clerk = await clerkClient();
    return Promise.all(
      collaborators.map(async (collaborator) => {
        try {
          const clerkUser = await clerk.users.getUser(collaborator.userId);
          const fallbackName = collaborator.name.trim();
          const fullName = clerkUser.fullName?.trim();
          const userName = [
            clerkUser.firstName?.trim(),
            clerkUser.lastName?.trim(),
          ]
            .filter(Boolean)
            .join(' ')
            .trim();
          const normalizedName =
            fullName ||
            userName ||
            clerkUser.username?.trim() ||
            fallbackName ||
            'Usuario';

          return {
            ...collaborator,
            name: normalizedName,
            imageUrl: clerkUser.imageUrl || collaborator.imageUrl,
          };
        } catch {
          return collaborator;
        }
      })
    );
  } catch {
    return collaborators;
  }
};

export async function getProjectSocialFeed(): Promise<ProjectSocialItem[]> {
  const raw = (await getPublicProjects()) as PublicProjectRecord[];
  return raw
    .map((project) => mapToSocialItem(project))
    .filter((item) => item.isPublic)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

const DEFAULT_COMMUNITY_FEED_LIMIT = 30;

export interface CommunityPostsFeedOptions {
  // Quien mira. Sus propias publicaciones siguen siendo visibles para él
  // aunque el proyecto al que cuelgan sea privado.
  viewerId?: string | null;
  // Quien administra la plataforma (super-admin / admin / educador) lee el
  // feed completo, la misma excepción que ya hace `/proyectos/[id]` con los
  // proyectos privados.
  canSeeAllProjects?: boolean;
  // Restringe el feed a un solo proyecto (además de las reglas de
  // visibilidad, nunca en su lugar).
  projectId?: number;
  // Restringe el feed a un solo autor (además de las reglas de visibilidad,
  // nunca en su lugar): pedir el `authorId` de otra persona sigue devolviendo
  // solo lo que quien mira ya podía ver.
  authorId?: string;
  limit?: number;
  offset?: number;
}

export interface CommunityPostsFeedPage {
  items: CommunityFeedPost[];
  hasMore: boolean;
}

/**
 * Visibilidad de una publicación de la comunidad. Se resuelve SIEMPRE en el
 * servidor, nunca filtrando en el cliente: una fila se ve cuando su proyecto
 * es público, cuando no cuelga de ningún proyecto (publicación general) o
 * cuando quien mira es su autor. Como `POST /api/community-posts` solo deja
 * publicar al dueño del proyecto, esa última condición es exactamente "el
 * dueño ve lo suyo aunque su proyecto sea privado", y al expresarla contra
 * `communityPosts.userId` ningún parámetro de la petición puede ampliarla.
 */
const communityPostVisibility = (
  viewerId?: string | null,
  canSeeAllProjects = false,
  includeOwnPrivate = false
) => {
  if (canSeeAllProjects) return undefined;
  const clauses = [
    eq(projects.isPublic, true),
    isNull(communityPosts.projectId),
  ];
  // Solo en las vistas ya acotadas a un proyecto o a un autor. En el muro
  // abierto de `/proyectos` esta cláusula haría que el dueño de un proyecto
  // privado viera ahí sus propias publicaciones, y lo pedido es que esas se
  // queden dentro del proyecto hasta que se marque como público.
  if (includeOwnPrivate && viewerId) {
    clauses.push(eq(communityPosts.userId, viewerId));
  }
  return or(...clauses);
};

// Feeds `CommunityPostCard` — one post-level select, joined with its author
// and (optionally) its linked project, so `/proyectos` can render a post
// alongside project cards on first paint without a second client round-trip.
// `GET /api/community-posts` delegates here too, so the Server Component path
// and the client-fetched one share a single mapper (and a single visibility
// rule) instead of drifting apart.
export async function getCommunityPostsFeedPage({
  viewerId,
  canSeeAllProjects = false,
  projectId,
  authorId,
  limit = DEFAULT_COMMUNITY_FEED_LIMIT,
  offset = 0,
}: CommunityPostsFeedOptions = {}): Promise<CommunityPostsFeedPage> {
  // One row more than asked for: whether it came back is what tells the
  // caller there is another page, with no extra COUNT query.
  const rows = await db
    .select({
      id: communityPosts.id,
      content: communityPosts.content,
      kind: communityPosts.kind,
      imageKey: communityPosts.imageKey,
      linkUrl: communityPosts.linkUrl,
      createdAt: communityPosts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorProfileImageKey: users.profileImageKey,
      projectId: projects.id,
      projectName: projects.name,
      projectNeedsCollaborators: projects.needsCollaborators,
      // Subconsulta escalar correlacionada en vez de un segundo join
      // agrupado: el select ya arrastra un `leftJoin` a `projects`, la
      // cláusula de visibilidad y el truco de `limit + 1`, y un `GROUP BY`
      // obligaría a listar todas esas columnas. Así el contador es aditivo,
      // sigue siendo UNA sola consulta por página, y Postgres lo resuelve
      // contra `community_post_comments_post_idx`.
      commentCount: sql<number>`(
        select count(*)
        from ${communityPostComments}
        where ${communityPostComments.postId} = ${communityPosts.id}
          and ${communityPostComments.deletedAt} is null
      )`.mapWith(Number),
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .leftJoin(projects, eq(communityPosts.projectId, projects.id))
    .where(
      and(
        // Una consulta ya acotada a un proyecto o a un autor es la vista
        // "dentro del proyecto" / "mi perfil": ahí el dueño sí ve lo suyo
        // aunque el proyecto sea privado. El muro abierto no pasa ninguno de
        // los dos filtros, así que ahí no entra.
        communityPostVisibility(
          viewerId,
          canSeeAllProjects,
          projectId !== undefined || authorId !== undefined
        ),
        projectId === undefined
          ? undefined
          : eq(communityPosts.projectId, projectId),
        authorId === undefined ? undefined : eq(communityPosts.userId, authorId)
      )
    )
    .orderBy(desc(communityPosts.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const items = rows.slice(0, limit).map((row) => ({
    id: row.id,
    content: row.content,
    kind: row.kind,
    imageKey: row.imageKey,
    imageUrl: toCoverImageUrl(row.imageKey),
    linkUrl: row.linkUrl,
    createdAt: toDateString(row.createdAt),
    author: {
      id: row.authorId,
      name: row.authorName?.trim() || row.authorEmail,
      avatarUrl: toAvatarUrl(row.authorProfileImageKey),
    },
    project:
      row.projectId !== null
        ? {
            id: row.projectId,
            name: row.projectName?.trim() || 'Proyecto sin título',
            needsCollaborators: Boolean(row.projectNeedsCollaborators),
          }
        : null,
    commentCount: row.commentCount,
  }));

  return { items, hasMore: rows.length > limit };
}

/**
 * ¿Puede quien mira ver esta publicación? Reutiliza literalmente
 * `communityPostVisibility`, la MISMA regla del feed, para que los endpoints
 * de comentarios no acaben con una copia que se desincronice: los
 * comentarios no tienen visibilidad propia, la heredan entera de su
 * publicación.
 *
 * El `leftJoin` con `projects` es obligatorio, no decorativo: el predicado
 * referencia `projects.isPublic` y sin la unión la consulta no es válida.
 *
 * Devuelve `null` cuando la publicación no existe O cuando quien mira no
 * puede verla: quien llama responde 404 en ambos casos, para no revelar la
 * existencia de una publicación ajena.
 */
export async function canViewCommunityPost(
  postId: number,
  viewerId?: string | null,
  canSeeAllProjects = false
): Promise<{ id: number; userId: string } | null> {
  const [post] = await db
    .select({ id: communityPosts.id, userId: communityPosts.userId })
    .from(communityPosts)
    .leftJoin(projects, eq(communityPosts.projectId, projects.id))
    .where(
      and(
        eq(communityPosts.id, postId),
        // Acotado a UNA publicación concreta: su autor puede comentarla
        // dentro de su proyecto aunque el proyecto siga siendo privado.
        communityPostVisibility(viewerId, canSeeAllProjects, true)
      )
    )
    .limit(1);

  return post ?? null;
}

// Primera (y única) página del feed para `/proyectos`, que no pagina.
export async function getCommunityPostsFeed(
  viewerId?: string | null,
  limit = DEFAULT_COMMUNITY_FEED_LIMIT
): Promise<CommunityFeedPost[]> {
  const { items } = await getCommunityPostsFeedPage({ viewerId, limit });
  return items;
}

// Publicaciones de una sola persona, paginadas, para la pestaña "Posts" del
// perfil. Reutiliza el feed completo con un filtro extra por autor, así que
// la visibilidad la sigue decidiendo `viewerId`. Como `communityPosts.projectId`
// apunta a la única tabla `projects` —donde el proyecto de un curso y el
// proyecto suelto son la misma fila con `courseId` lleno o nulo—, esta consulta
// cubre los dos tipos y también las publicaciones generales (sin proyecto).
export async function getCommunityPostsByAuthor(
  authorId: string,
  viewerId?: string | null,
  limit = DEFAULT_COMMUNITY_FEED_LIMIT,
  offset = 0
): Promise<CommunityPostsFeedPage> {
  return getCommunityPostsFeedPage({ viewerId, authorId, limit, offset });
}

/**
 * Total de publicaciones de una persona, para el contador del perfil. No
 * lleva cláusula de visibilidad a propósito: solo se usa donde quien mira ES
 * el autor, y en ese caso `communityPostVisibility` ya deja pasar todas sus
 * filas. No reutilizar este contador en un perfil público sin añadirla.
 */
export async function countCommunityPostsByAuthor(
  authorId: string
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(communityPosts)
    .where(eq(communityPosts.userId, authorId));
  return row?.total ?? 0;
}

export async function getProjectSocialCollections(
  viewerId?: string | null
): Promise<ProjectSocialCollections> {
  const exploreItems = await getProjectSocialFeed();
  const collaboratorMap = new Map<string, ProjectSocialCollaborator>();
  exploreItems
    .filter((item) => item.needsCollaborators)
    .forEach((item) => {
      const userId = item.author.id?.trim();
      if (!userId) return;
      if (collaboratorMap.has(userId)) return;
      collaboratorMap.set(userId, {
        userId,
        name: item.author.name?.trim() || 'Usuario',
      });
    });
  const collaboratorItems = await enrichCollaboratorsWithClerk(
    Array.from(collaboratorMap.values())
  );

  if (!viewerId) {
    return {
      exploreItems,
      myItems: [],
      collaborationItems: [],
      collaboratorItems,
    };
  }

  const ownRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      planteamiento: projects.planteamiento,
      justificacion: projects.justificacion,
      objetivo_general: projects.objetivo_general,
      requirements: projects.requirements,
      type_project: projects.type_project,
      isPublic: projects.isPublic,
      needsCollaborators: projects.needsCollaborators,
      createdAt: projects.createdAt,
      coverImageKey: projects.coverImageKey,
      coverVideoKey: projects.coverVideoKey,
      userId: projects.userId,
      courseId: projects.courseId,
      categoryId: projects.categoryId,
      categoryName: categories.name,
      ownerName: users.name,
      ownerEmail: users.email,
      fecha_inicio: projects.fecha_inicio,
      fecha_fin: projects.fecha_fin,
    })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .innerJoin(users, eq(projects.userId, users.id))
    .where(eq(projects.userId, viewerId));

  const collaborationRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      planteamiento: projects.planteamiento,
      justificacion: projects.justificacion,
      objetivo_general: projects.objetivo_general,
      requirements: projects.requirements,
      type_project: projects.type_project,
      isPublic: projects.isPublic,
      needsCollaborators: projects.needsCollaborators,
      createdAt: projects.createdAt,
      coverImageKey: projects.coverImageKey,
      coverVideoKey: projects.coverVideoKey,
      userId: projects.userId,
      courseId: projects.courseId,
      categoryId: projects.categoryId,
      categoryName: categories.name,
      ownerName: users.name,
      ownerEmail: users.email,
      fecha_inicio: projects.fecha_inicio,
      fecha_fin: projects.fecha_fin,
    })
    .from(projectsTaken)
    .innerJoin(projects, eq(projectsTaken.projectId, projects.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .innerJoin(users, eq(projects.userId, users.id))
    .where(eq(projectsTaken.userId, viewerId));

  // "Mis proyectos" is the owner's own shelf, so it lists every project they
  // own. Filtering it by isPublic hid their private and draft projects from
  // themselves.
  const ownItems = ownRows.map((row) =>
    mapToSocialItem(mapUserRowToRecord(row), {
      viewerId,
      ownerId: row.userId,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
    })
  );

  const collaborationItemsMap = new Map<number, ProjectSocialItem>();
  collaborationRows
    .filter((row) => row.userId !== viewerId)
    .forEach((row) => {
      collaborationItemsMap.set(
        row.id,
        mapToSocialItem(mapUserRowToRecord(row), {
          viewerId,
          ownerId: row.userId,
          ownerName: row.ownerName,
          ownerEmail: row.ownerEmail,
          isCollaborator: true,
        })
      );
    });

  const collaborationItems = Array.from(collaborationItemsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const myItemsMap = new Map<number, ProjectSocialItem>();
  [...ownItems, ...collaborationItems].forEach((item) => {
    myItemsMap.set(item.id, item);
  });

  const myItems = Array.from(myItemsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    exploreItems,
    myItems,
    collaborationItems,
    collaboratorItems,
  };
}

export async function getPublicProjectsByOwner(
  userId: string,
  viewerId?: string | null
): Promise<ProjectSocialItem[]> {
  const includePrivate = Boolean(viewerId && viewerId === userId);
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      planteamiento: projects.planteamiento,
      justificacion: projects.justificacion,
      objetivo_general: projects.objetivo_general,
      requirements: projects.requirements,
      type_project: projects.type_project,
      isPublic: projects.isPublic,
      needsCollaborators: projects.needsCollaborators,
      createdAt: projects.createdAt,
      coverImageKey: projects.coverImageKey,
      coverVideoKey: projects.coverVideoKey,
      userId: projects.userId,
      courseId: projects.courseId,
      categoryId: projects.categoryId,
      categoryName: categories.name,
      ownerName: users.name,
      ownerEmail: users.email,
      fecha_inicio: projects.fecha_inicio,
      fecha_fin: projects.fecha_fin,
    })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .innerJoin(users, eq(projects.userId, users.id))
    .where(
      includePrivate
        ? eq(projects.userId, userId)
        : and(eq(projects.userId, userId), eq(projects.isPublic, true))
    )
    .orderBy(desc(projects.createdAt));

  return rows.map((row) =>
    mapToSocialItem(mapUserRowToRecord(row), {
      ownerId: row.userId,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
    })
  );
}

export async function getCollaboratorPublicDetails(userId: string): Promise<{
  collaborator: ProjectSocialCollaborator;
  projects: ProjectSocialItem[];
} | null> {
  const [dbUser] = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!dbUser) return null;

  const [collaborator] = await enrichCollaboratorsWithClerk([
    {
      userId: dbUser.id,
      name: dbUser.name?.trim() || 'Usuario',
    },
  ]);

  const projects = await getPublicProjectsByOwner(userId);
  return {
    collaborator: collaborator ?? {
      userId: dbUser.id,
      name: dbUser.name?.trim() || 'Usuario',
    },
    projects,
  };
}

/**
 * Trae un proyecto para su ficha.
 *
 * Por defecto solo devuelve proyectos publicos: esta pagina es la vista
 * social, abierta a cualquiera. `permitirPrivado` lo usa la ficha cuando ya
 * ha comprobado que quien mira tiene derecho a ver el proyecto (su dueno, o
 * un admin/educador desde el panel del curso). Nunca lo actives sin esa
 * comprobacion previa: expondria proyectos privados a todo el mundo.
 */
export async function getProjectSocialById(
  id: number,
  permitirPrivado = false
): Promise<ProjectSocialItem | null> {
  const project = await getProjectById(id);
  if (!project) return null;
  if (!project.isPublic && !permitirPrivado) return null;

  return mapToSocialItem({
    id: project.id,
    name: project.name,
    planteamiento: project.planteamiento,
    justificacion: project.justificacion,
    objetivo_general: project.objetivo_general,
    requirements: project.requirements,
    type_project: project.type_project,
    isPublic: project.isPublic,
    needsCollaborators: project.needsCollaborators,
    createdAt: project.createdAt,
    // Sin esto la ficha no sabe a que curso pertenece el proyecto, y no
    // puede ofrecer el "Entrar" que lleva a su espacio de trabajo.
    courseId: project.courseId ?? null,
    coverImageKey: project.coverImageKey,
    coverVideoKey: project.coverVideoKey,
    userId: project.userId,
    user: {
      id: project.userId,
      name: undefined,
      email: undefined,
    },
    category: {
      id: project.categoryId,
      name: project.categoryName,
    },
    objetivosEsp: project.objetivos_especificos?.map(
      (item) => item.description
    ),
    fecha_inicio: project.fecha_inicio ?? null,
    fecha_fin: project.fecha_fin ?? null,
  });
}
