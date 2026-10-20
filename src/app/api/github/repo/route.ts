import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { env } from '~/env';
import { parseRepositoryUrl } from '~/lib/github/parseRepositoryUrl';
import { db } from '~/server/db';
import { guidedProjects, projects } from '~/server/db/schema';
import { getGuidedProjectContentAccess } from '~/server/services/guided-projects/guidedForumAccess';
import { type ApiSession, getApiSession } from '~/server/utils/apiAuth';

// Proxy de solo lectura hacia la API pública de GitHub para el explorador de
// repositorio (panel de administración y páginas de estudiantes). Centraliza
// el parseo de la URL, el header de autenticación opcional (GITHUB_TOKEN) y
// el formato de respuesta, para que el cliente no llame a GitHub directamente.
//
// El repositorio se resuelve desde el proyecto (`source` + `id`), nunca desde
// una URL del cliente: así el proxy no sirve para consultar repos arbitrarios
// con nuestro token.

const MAX_PATH_LENGTH = 500;

type RepositoryLookup =
  | { ok: true; repositoryUrl: string }
  | { ok: false; status: 400 | 401 | 403 | 404; error: string };

/**
 * Staff can open any guided project's repository; anyone else needs content
 * access (enrolled student or the project's instructor), checked before the
 * response says whether a repository is linked at all.
 */
async function resolveGuidedRepository(
  projectId: number,
  session: ApiSession & { userId: string }
): Promise<RepositoryLookup> {
  const [project] = await db
    .select({ repositoryUrl: guidedProjects.repositoryUrl })
    .from(guidedProjects)
    .where(eq(guidedProjects.id, projectId))
    .limit(1);
  if (!project) {
    return { ok: false, status: 404, error: 'Proyecto no encontrado' };
  }

  if (!session.isStaff) {
    const access = await getGuidedProjectContentAccess({
      projectId,
      userId: session.userId,
    });
    if (!access.success) {
      return {
        ok: false,
        status: 403,
        error: 'Inscríbete en el proyecto para ver su repositorio.',
      };
    }
  }

  if (!project.repositoryUrl) {
    return {
      ok: false,
      status: 404,
      error: 'Este proyecto todavía no tiene un repositorio vinculado.',
    };
  }
  return { ok: true, repositoryUrl: project.repositoryUrl };
}

/**
 * A user project's repository is visible to its owner and staff, and to any
 * signed-in user once the owner made the project public.
 */
async function resolveUserProjectRepository(
  projectId: number,
  session: ApiSession & { userId: string }
): Promise<RepositoryLookup> {
  const [project] = await db
    .select({
      userId: projects.userId,
      isPublic: projects.isPublic,
      repositoryUrl: projects.repositoryUrl,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) {
    return { ok: false, status: 404, error: 'Proyecto no encontrado' };
  }

  const canView =
    session.isStaff || project.userId === session.userId || project.isPublic;
  if (!canView) {
    return { ok: false, status: 403, error: 'No autorizado' };
  }

  if (!project.repositoryUrl) {
    return {
      ok: false,
      status: 404,
      error: 'Este proyecto todavía no tiene un repositorio vinculado.',
    };
  }
  return { ok: true, repositoryUrl: project.repositoryUrl };
}

async function resolveRepository(
  searchParams: URLSearchParams,
  session: ApiSession & { userId: string }
): Promise<RepositoryLookup> {
  const source = searchParams.get('source');
  const projectId = Number(searchParams.get('id'));
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return { ok: false, status: 400, error: 'Proyecto inválido' };
  }

  if (source === 'guided') {
    return resolveGuidedRepository(projectId, session);
  }
  if (source === 'project') {
    return resolveUserProjectRepository(projectId, session);
  }
  return { ok: false, status: 400, error: 'Tipo de proyecto inválido' };
}

/**
 * Encodes each segment of a repository path. Rejects `.`/`..` segments, so a
 * path can never climb out of `/contents/` to another GitHub API endpoint.
 */
function toContentsPath(rawPath: string): string | null {
  if (rawPath.length > MAX_PATH_LENGTH) return null;
  const segments = rawPath.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }
  return segments.map((segment) => encodeURIComponent(segment)).join('/');
}

interface GithubRepoMeta {
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: { login: string; avatar_url: string };
}

interface GithubContentEntry {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  html_url: string;
}

interface GithubFileContent extends GithubContentEntry {
  content?: string;
  encoding?: string;
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function GET(request: Request) {
  const session = await getApiSession();
  const { userId } = session;
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lookup = await resolveRepository(searchParams, { ...session, userId });
  if (!lookup.ok) {
    return NextResponse.json(
      { error: lookup.error },
      { status: lookup.status }
    );
  }

  const path = toContentsPath(searchParams.get('path') ?? '');
  if (path === null) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }

  const parsed = parseRepositoryUrl(lookup.repositoryUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: 'El link no parece ser un repositorio válido de GitHub' },
      { status: 400 }
    );
  }
  const { owner, repo } = parsed;

  try {
    const metaRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: githubHeaders(), next: { revalidate: 300 } }
    );

    if (metaRes.status === 404) {
      return NextResponse.json(
        { error: 'Repositorio no encontrado (¿es privado?)' },
        { status: 404 }
      );
    }
    if (metaRes.status === 403) {
      return NextResponse.json(
        {
          error:
            'Límite de la API de GitHub alcanzado. Intenta de nuevo en unos minutos.',
        },
        { status: 429 }
      );
    }
    if (!metaRes.ok) {
      return NextResponse.json(
        { error: 'Error consultando GitHub' },
        { status: 502 }
      );
    }

    const repoMeta = (await metaRes.json()) as GithubRepoMeta;

    const contentsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(repoMeta.default_branch)}`,
      { headers: githubHeaders(), next: { revalidate: 60 } }
    );

    if (!contentsRes.ok) {
      return NextResponse.json(
        { error: 'No se pudo cargar esa ruta del repositorio' },
        { status: contentsRes.status }
      );
    }

    const contentsData: GithubContentEntry[] | GithubFileContent =
      await contentsRes.json();

    const repoSummary = {
      fullName: repoMeta.full_name,
      description: repoMeta.description,
      htmlUrl: repoMeta.html_url,
      defaultBranch: repoMeta.default_branch,
      stars: repoMeta.stargazers_count,
      forks: repoMeta.forks_count,
      language: repoMeta.language,
      ownerLogin: repoMeta.owner.login,
      ownerAvatarUrl: repoMeta.owner.avatar_url,
    };

    if (Array.isArray(contentsData)) {
      const entries = contentsData
        .map((entry) => ({
          name: entry.name,
          path: entry.path,
          type: entry.type === 'dir' ? ('dir' as const) : ('file' as const),
          size: entry.size,
        }))
        .sort((a, b) =>
          a.type === b.type
            ? a.name.localeCompare(b.name)
            : a.type === 'dir'
              ? -1
              : 1
        );
      return NextResponse.json({ repo: repoSummary, kind: 'dir', entries });
    }

    const file = contentsData;
    const content =
      file.content && file.encoding === 'base64'
        ? Buffer.from(file.content, 'base64').toString('utf-8')
        : '';

    return NextResponse.json({
      repo: repoSummary,
      kind: 'file',
      file: { name: file.name, path: file.path, size: file.size, content },
    });
  } catch (error) {
    console.error('❌ Error consultando la API de GitHub:', error);
    return NextResponse.json(
      { error: 'Error consultando GitHub' },
      { status: 500 }
    );
  }
}
