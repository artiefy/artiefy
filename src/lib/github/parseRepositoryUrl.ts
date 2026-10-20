export interface GithubRepositoryRef {
  owner: string;
  repo: string;
}

/**
 * Reads `owner/repo` from a GitHub repository link (`https://github.com/o/r`,
 * optionally ending in `.git` or a deeper path). Returns null for anything
 * that is not a GitHub repository. The names follow GitHub's own rules, which
 * also keeps them safe to put in a GitHub API path as they are.
 */
export function parseRepositoryUrl(
  repoUrl: string
): GithubRepositoryRef | null {
  try {
    const url = new URL(repoUrl.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!/(^|\.)github\.com$/.test(url.hostname)) return null;
    const [owner, rawRepo] = url.pathname.replace(/^\/+/, '').split('/');
    if (!owner || !rawRepo) return null;
    const repo = rawRepo.replace(/\.git$/, '');
    if (!/^[A-Za-z0-9-]+$/.test(owner)) return null;
    if (!/^[A-Za-z0-9._-]+$/.test(repo) || /^\.+$/.test(repo)) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

/** The canonical link stored for a repository. */
export function toRepositoryUrl({ owner, repo }: GithubRepositoryRef) {
  return `https://github.com/${owner}/${repo}`;
}
