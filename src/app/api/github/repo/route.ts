import { NextResponse } from 'next/server';

import { env } from '~/env';
import { authorizeStaff } from '~/server/utils/apiAuth';

// Proxy de solo lectura hacia la API pública de GitHub para el explorador de
// repositorio del panel de super admin. Centraliza el parseo de la URL, el
// header de autenticación opcional (GITHUB_TOKEN) y el formato de respuesta,
// para que el cliente no llame a GitHub directamente.

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

function parseOwnerRepo(
  repoUrl: string
): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl.trim());
    if (!/(^|\.)github\.com$/.test(url.hostname)) return null;
    const [owner, rawRepo] = url.pathname.replace(/^\/+/, '').split('/');
    if (!owner || !rawRepo) return null;
    const repo = rawRepo.replace(/\.git$/, '');
    return { owner, repo };
  } catch {
    return null;
  }
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
  const authResult = await authorizeStaff();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: authResult.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const repoUrlParam = searchParams.get('url');
  const path = searchParams.get('path') ?? '';

  if (!repoUrlParam) {
    return NextResponse.json(
      { error: 'Falta el parámetro url' },
      { status: 400 }
    );
  }

  const parsed = parseOwnerRepo(repoUrlParam);
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
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=${repoMeta.default_branch}`,
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
