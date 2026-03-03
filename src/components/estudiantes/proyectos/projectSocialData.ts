import { clerkClient } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';

import { getProjectById } from '~/server/actions/project/getProjectById';
import getPublicProjects from '~/server/actions/project/getPublicProjects';
import { db } from '~/server/db';
import { categories, projects, projectsTaken, users } from '~/server/db/schema';

import type { ProjectSocialCollaborator, ProjectSocialItem } from './types';

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

  const ownPublicItems = ownRows
    .filter((row) => row.isPublic)
    .map((row) =>
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
  [...ownPublicItems, ...collaborationItems].forEach((item) => {
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
  userId: string
): Promise<ProjectSocialItem[]> {
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
    .where(and(eq(projects.userId, userId), eq(projects.isPublic, true)))
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

export async function getProjectSocialById(
  id: number
): Promise<ProjectSocialItem | null> {
  const project = await getProjectById(id);
  if (!project?.isPublic) return null;

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
