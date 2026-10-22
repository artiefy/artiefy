'use client';

import { type Dispatch, useEffect, useReducer } from 'react';

import Image from 'next/image';

import {
  ChevronRight,
  ExternalLink,
  File as FileIcon,
  Folder,
  GitFork,
  Loader2,
  Star,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import ReactMarkdown, { type Components } from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

/** Which kind of project the repository link belongs to. */
export type RepositorySource = 'guided' | 'project';

interface RepoSummary {
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  language: string | null;
  ownerLogin: string;
  ownerAvatarUrl: string;
}

interface RepoEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
}

interface RepoFile {
  name: string;
  path: string;
  size: number;
  content: string;
}

type RepoResponse =
  | { repo: RepoSummary; kind: 'dir'; entries: RepoEntry[] }
  | { repo: RepoSummary; kind: 'file'; file: RepoFile };

interface ExplorerState {
  summary: RepoSummary | null;
  entries: RepoEntry[] | null;
  /** Folder whose entries are listed; '' is the repository root. */
  dirPath: string;
  file: RepoFile | null;
  loading: boolean;
  error: string | null;
}

type ExplorerAction =
  | { type: 'start' }
  | { type: 'loaded'; data: RepoResponse; path: string }
  | { type: 'failed'; message: string };

const INITIAL_STATE: ExplorerState = {
  summary: null,
  entries: null,
  dirPath: '',
  file: null,
  loading: false,
  error: null,
};

const DEFAULT_ERROR = 'Error consultando el repositorio';

const sectionClass =
  'rounded-2xl border border-white/10 bg-[#061c37] p-6 md:p-8';

const CODE_LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  scss: 'scss',
  html: 'markup',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  php: 'php',
  sql: 'sql',
  sh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
};

function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction
): ExplorerState {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, error: null };
    case 'loaded':
      return action.data.kind === 'dir'
        ? {
            ...state,
            summary: action.data.repo,
            entries: action.data.entries,
            dirPath: action.path,
            file: null,
            loading: false,
          }
        : {
            ...state,
            summary: action.data.repo,
            file: action.data.file,
            loading: false,
          };
    case 'failed':
      return {
        ...state,
        entries: null,
        file: null,
        loading: false,
        error: action.message,
      };
  }
}

/**
 * Loads one folder or file through the server proxy. The proxy resolves the
 * repository from the project itself, so the browser never names the URL.
 */
async function loadRepoPath(
  source: RepositorySource,
  projectId: number,
  path: string,
  dispatch: Dispatch<ExplorerAction>,
  signal?: AbortSignal
): Promise<void> {
  dispatch({ type: 'start' });
  try {
    const params = new URLSearchParams({
      source,
      id: String(projectId),
      path,
    });
    const res = await fetch(`/api/github/repo?${params.toString()}`, {
      signal,
    });
    const data = (await res.json()) as RepoResponse | { error?: string };
    if (!res.ok || !('repo' in data)) {
      const message = 'error' in data ? data.error : undefined;
      dispatch({ type: 'failed', message: message ?? DEFAULT_ERROR });
      return;
    }
    dispatch({ type: 'loaded', data, path });

    // Opens the README at the root, like GitHub does.
    if (data.kind === 'dir' && path === '') {
      const readme = data.entries.find((entry) =>
        /^readme\.md$/i.test(entry.name)
      );
      if (readme) {
        await loadRepoPath(source, projectId, readme.path, dispatch, signal);
      }
    }
  } catch {
    if (!signal?.aborted) {
      dispatch({ type: 'failed', message: DEFAULT_ERROR });
    }
  }
}

/**
 * README images are often relative paths; they point at the file's folder
 * in the repository, so they are served from raw.githubusercontent.com.
 * Anything that is not an http(s) image (data:, javascript:...) is dropped.
 */
function resolveReadmeImage(
  src: string | undefined,
  repo: RepoSummary,
  filePath: string
): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(src)) return null;

  const root = `https://raw.githubusercontent.com/${repo.fullName}/${encodeURIComponent(repo.defaultBranch)}/`;
  const folder = filePath.split('/').slice(0, -1).join('/');
  const base = src.startsWith('/') || !folder ? root : `${root}${folder}/`;
  return new URL(src.replace(/^\/+/, ''), base).toString();
}

// Brand styles for the rendered README (the Tailwind typography plugin is
// not installed in the project).
function createMarkdownComponents(
  resolveImage: (src: string | undefined) => string | null
): Components {
  return {
    h1: ({ children }) => (
      <h1 className="mt-6 mb-3 border-b border-white/10 pb-2 text-2xl font-bold text-white first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-5 mb-2 border-b border-white/10 pb-1.5 text-xl font-bold text-white">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-4 mb-2 text-lg font-bold text-white">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 leading-relaxed text-white/80">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#22C4D3] underline hover:text-[#6cecf4]"
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 list-disc space-y-1 pl-5 text-white/80">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-1 pl-5 text-white/80">
        {children}
      </ol>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-3 border-l-2 border-[#22C4D3]/40 pl-3 text-white/60 italic">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-white/10" />,
    img: ({ src, alt }) => {
      const resolved = resolveImage(typeof src === 'string' ? src : undefined);
      if (!resolved) return null;
      // README images come from any host and have no known size, so they
      // skip the optimizer and size themselves.
      return (
        <Image
          src={resolved}
          alt={alt ?? ''}
          width={0}
          height={0}
          sizes="100vw"
          unoptimized
          className="my-3 inline-block size-auto max-w-full rounded-lg"
        />
      );
    },
    table: ({ children }) => (
      <div className="mb-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-white/10 bg-white/5 px-3 py-1.5 text-left text-white">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-white/10 px-3 py-1.5 text-white/80">
        {children}
      </td>
    ),
    code: ({ className, children }) => {
      const isBlock = /language-/.test(className ?? '');
      if (isBlock) {
        return (
          <code className="block overflow-x-auto rounded-lg bg-[#04101f] p-3 font-mono text-xs text-white/90">
            {children}
          </code>
        );
      }
      return (
        <code className="rounded bg-[#04101f] px-1.5 py-0.5 font-mono text-xs text-[#22C4D3]">
          {children}
        </code>
      );
    },
  };
}

interface RepositoryExplorerProps {
  source: RepositorySource;
  projectId: number;
  /** The linked repository; the explorer shows `emptyMessage` without one. */
  repositoryUrl: string | null;
  emptyMessage?: string;
}

/**
 * Read-only GitHub repository browser (summary, file tree, file viewer with
 * the README rendered). Shared by the admin and student project pages so
 * both look the same. Remount it (`key`) when the repository link changes.
 */
export function RepositoryExplorer({
  source,
  projectId,
  repositoryUrl,
  emptyMessage = 'Este proyecto todavía no tiene un repositorio vinculado.',
}: RepositoryExplorerProps) {
  const [state, dispatch] = useReducer(explorerReducer, INITIAL_STATE);
  const { summary, entries, dirPath, file, loading, error } = state;

  useEffect(() => {
    if (!repositoryUrl) return;
    const controller = new AbortController();
    void loadRepoPath(source, projectId, '', dispatch, controller.signal);
    return () => controller.abort();
  }, [source, projectId, repositoryUrl]);

  if (!repositoryUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-[#22C4D3]/30 bg-[#061c37]/50 p-10 text-center text-white/50">
        <FaGithub className="mx-auto mb-3 size-8" />
        {emptyMessage}
      </div>
    );
  }

  const openPath = (path: string) =>
    void loadRepoPath(source, projectId, path, dispatch);

  const breadcrumbs = (file?.path ?? dirPath).split('/').filter(Boolean);
  const markdownComponents = summary
    ? createMarkdownComponents((src) =>
        resolveReadmeImage(src, summary, file?.path ?? '')
      )
    : undefined;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {summary && (
        <section className={sectionClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={summary.ownerAvatarUrl}
                alt={summary.ownerLogin}
                width={40}
                height={40}
                className="shrink-0 rounded-full"
                unoptimized
              />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-white">
                  {summary.fullName}
                </h2>
                {summary.description && (
                  <p className="truncate text-sm text-white/60">
                    {summary.description}
                  </p>
                )}
              </div>
            </div>
            <a
              href={summary.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#22C4D3]/40 bg-[#22C4D3]/10 px-3 py-1.5 text-xs font-semibold text-[#22C4D3] transition hover:bg-[#22C4D3]/20"
            >
              <ExternalLink className="size-3.5" />
              Ver en GitHub
            </a>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/60">
            {summary.language && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#22C4D3]" />
                {summary.language}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-3.5" />
              {summary.stars}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GitFork className="size-3.5" />
              {summary.forks}
            </span>
            <span>Rama: {summary.defaultBranch}</span>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <section className={`${sectionClass} md:col-span-1`}>
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-white/50 uppercase">
            Archivos
          </h3>
          {dirPath && (
            <button
              type="button"
              onClick={() =>
                openPath(dirPath.split('/').slice(0, -1).join('/'))
              }
              className="mb-2 flex items-center gap-1 text-xs text-[#22C4D3] hover:underline"
            >
              ← Subir un nivel
            </button>
          )}
          {loading && !entries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-[#22C4D3]" />
            </div>
          ) : (
            <ul className="max-h-[420px] space-y-0.5 overflow-y-auto">
              {(entries ?? []).map((entry) => (
                <li key={entry.path}>
                  <button
                    type="button"
                    onClick={() => openPath(entry.path)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/5 ${
                      file?.path === entry.path
                        ? 'bg-[#22C4D3]/10 text-[#22C4D3]'
                        : 'text-white/80'
                    }`}
                  >
                    {entry.type === 'dir' ? (
                      <Folder className="size-4 shrink-0 text-[#22C4D3]" />
                    ) : (
                      <FileIcon className="size-4 shrink-0 text-white/40" />
                    )}
                    <span className="truncate">{entry.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${sectionClass} min-w-0 md:col-span-2`}>
          {breadcrumbs.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-white/50">
              {breadcrumbs.map((part, index) => (
                <span
                  key={`${part}-${index}`}
                  className="flex items-center gap-1"
                >
                  {index > 0 && <ChevronRight className="size-3" />}
                  {part}
                </span>
              ))}
            </div>
          )}
          {loading && !file && !entries ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-[#22C4D3]" />
            </div>
          ) : file ? (
            file.name.toLowerCase().endsWith('.md') ? (
              <div className="max-w-none text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {file.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <SyntaxHighlighter
                  language={
                    CODE_LANGUAGE_BY_EXTENSION[
                      file.name.split('.').pop()?.toLowerCase() ?? ''
                    ] ?? 'text'
                  }
                  style={oneDark}
                  customStyle={{
                    background: 'transparent',
                    fontSize: '0.8rem',
                    padding: 0,
                  }}
                  showLineNumbers
                >
                  {file.content}
                </SyntaxHighlighter>
              </div>
            )
          ) : (
            <p className="py-16 text-center text-sm text-white/40">
              Selecciona un archivo para verlo aquí.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
