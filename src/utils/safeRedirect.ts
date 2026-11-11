const BACKSLASH = String.fromCharCode(92);

/**
 * Validates a post-authentication redirect target.
 *
 * `redirect_url` arrives from the query string, the URL hash or session
 * storage, so it is attacker-controlled. Only same-origin paths are accepted;
 * anything else (other hosts, protocol-relative `//host`, `/\host`,
 * `javascript:` and so on) falls back to `fallback`.
 *
 * An absolute URL is accepted only when it points at this same origin, and it
 * is reduced to its path, so callers that used to receive a full URL keep
 * working. On the server there is no origin to compare against, so only
 * relative paths pass.
 */
export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = '/estudiantes'
): string {
  if (typeof value !== 'string') return fallback;

  const candidate = value.trim();
  if (!candidate) return fallback;

  const origin =
    typeof window === 'undefined'
      ? 'http://redirect.invalid'
      : window.location.origin;

  // Absolute URL: allowed only for this exact origin, reduced to its path.
  if (/^https?:\/\//i.test(candidate)) {
    if (typeof window === 'undefined') return fallback;
    try {
      const absolute = new URL(candidate);
      if (absolute.origin !== origin) return fallback;
      return getSafeRedirectPath(
        `${absolute.pathname}${absolute.search}${absolute.hash}`,
        fallback
      );
    } catch {
      return fallback;
    }
  }

  // Relative path: one leading slash, never `//host` or `/\host`.
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) {
    return fallback;
  }
  // Backslashes and control characters are normalized by URL parsers (a tab
  // between two slashes becomes `//host`), so they are never legitimate here.
  for (let index = 0; index < candidate.length; index += 1) {
    const code = candidate.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f || candidate[index] === BACKSLASH) {
      return fallback;
    }
  }

  try {
    const resolved = new URL(candidate, origin);
    if (resolved.origin !== origin) return fallback;
    const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
    // Dot segments are collapsed while parsing, so `/.//evil.tld` or
    // `/%2e//evil.tld` come out as `//evil.tld`, a protocol-relative URL to
    // another host. Re-check the normalized result.
    if (path.startsWith('//') || path.startsWith(`/${BACKSLASH}`)) {
      return fallback;
    }
    return path;
  } catch {
    return fallback;
  }
}
