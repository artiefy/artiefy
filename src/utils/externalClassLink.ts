/**
 * Helpers for the external recording link an admin/educator can attach to a
 * class meeting (`class_meetings.video_url_ext`) when the live session was not
 * recorded by the platform.
 *
 * Pure module: no React, no env access, safe to import from server or client.
 */

export type ExternalClassLinkKind = 'video-file' | 'video-embed' | 'link';

export interface ExternalClassLink {
  kind: ExternalClassLinkKind;
  /** Normalized, http(s)-only URL safe to use as a link target. */
  url: string;
  /** Only present for `video-embed`: the framable player URL. */
  embedUrl?: string;
}

const VIDEO_FILE_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.ogg',
  '.ogv',
  '.mov',
  '.m4v',
  '.m3u8',
];

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID_PATTERN = /^\/(?:video\/)?(\d+)/;
const DRIVE_FILE_PATTERN = /^\/file\/d\/([A-Za-z0-9_-]+)/;
const LOOM_ID_PATTERN = /^\/(?:share|embed)\/([A-Za-z0-9]+)/;

/**
 * Parses an untrusted value and accepts it only when it is a well-formed
 * `http:` / `https:` URL. Anything else (empty, relative, `javascript:`,
 * `data:`, `vbscript:`, malformed) is rejected.
 */
const parseSafeUrl = (raw?: string | null): URL | null => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Single predicate used by every class-meeting list filter: returns the safe
 * external link of a meeting, or `null` when it has none. Keeping the recorded
 * and the live lists on this one predicate (and its negation) is what keeps
 * them mutually exclusive.
 */
export const getExternalClassLink = (raw?: string | null): string | null =>
  parseSafeUrl(raw)?.toString() ?? null;

const getHost = (parsed: URL) =>
  parsed.hostname.toLowerCase().replace(/^www\./, '');

const getYoutubeEmbedUrl = (parsed: URL): string | null => {
  const host = getHost(parsed);
  const segments = parsed.pathname.split('/').filter(Boolean);

  let id: string | null = null;
  if (host === 'youtu.be') {
    id = segments[0] ?? null;
  } else if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    if (segments[0] === 'watch') {
      id = parsed.searchParams.get('v');
    } else if (
      segments[0] === 'embed' ||
      segments[0] === 'live' ||
      segments[0] === 'shorts'
    ) {
      id = segments[1] ?? null;
    }
  }

  if (!id || !YOUTUBE_ID_PATTERN.test(id)) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
};

const getVimeoEmbedUrl = (parsed: URL): string | null => {
  const host = getHost(parsed);
  // `player.vimeo.com/video/<id>` is what Vimeo's own share dialog hands out,
  // so it has to embed like the canonical `vimeo.com/<id>` form.
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
  const match = VIMEO_ID_PATTERN.exec(parsed.pathname);
  if (!match) return null;
  return `https://player.vimeo.com/video/${match[1]}`;
};

const getDriveEmbedUrl = (parsed: URL): string | null => {
  if (getHost(parsed) !== 'drive.google.com') return null;
  // Only single files can be previewed inline; folders, Docs, Sheets and
  // Slides fall through to a plain link.
  const match = DRIVE_FILE_PATTERN.exec(parsed.pathname);
  if (!match) return null;
  return `https://drive.google.com/file/d/${match[1]}/preview`;
};

const getLoomEmbedUrl = (parsed: URL): string | null => {
  if (getHost(parsed) !== 'loom.com') return null;
  const match = LOOM_ID_PATTERN.exec(parsed.pathname);
  if (!match) return null;
  return `https://www.loom.com/embed/${match[1]}`;
};

const EMBED_RESOLVERS = [
  getYoutubeEmbedUrl,
  getVimeoEmbedUrl,
  getDriveEmbedUrl,
  getLoomEmbedUrl,
];

/**
 * Classifies an external class link so the UI knows how to open it:
 * - `video-file`: a direct media file, playable by the platform player.
 * - `video-embed`: a known host with a framable player (`embedUrl`).
 * - `link`: anything else, opened in a new tab.
 *
 * Returns `null` when the value is not a safe http(s) URL. An unparseable
 * value is never treated as a video.
 */
export const classifyExternalClassLink = (
  raw?: string | null
): ExternalClassLink | null => {
  const parsed = parseSafeUrl(raw);
  if (!parsed) return null;

  const url = parsed.toString();
  const pathname = parsed.pathname.toLowerCase();

  // Only an https file can be played inline: the platform is served over
  // https, so an http media source is blocked as mixed content and the player
  // would sit there empty with no way out. Falling through to `link` gives the
  // student the "Abrir enlace" escape hatch instead.
  if (
    parsed.protocol === 'https:' &&
    VIDEO_FILE_EXTENSIONS.some((extension) => pathname.endsWith(extension))
  ) {
    return { kind: 'video-file', url };
  }

  for (const resolve of EMBED_RESOLVERS) {
    const embedUrl = resolve(parsed);
    if (embedUrl) return { kind: 'video-embed', url, embedUrl };
  }

  return { kind: 'link', url };
};
