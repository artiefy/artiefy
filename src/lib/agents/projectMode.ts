'use client';

import type { ProjectAiMode } from '~/components/projects/Modals/ProjectModeChooser';

/**
 * How much Artie should do on each project, as picked in `ProjectModeChooser`.
 *
 * Kept in the browser, not in `projects`: it only tunes how the Coach talks
 * (sent along with every chat message), so losing it on another device just
 * falls back to the Coach's default behaviour. Moving it to a column is the
 * upgrade path if it ever needs to follow the learner around.
 */
const STORAGE_KEY = 'artiefy.project-ai-mode';

const MODES: readonly ProjectAiMode[] = ['guided', 'copilot', 'autonomous'];

function readAll(): Record<string, ProjectAiMode> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, ProjectAiMode>)
      : {};
  } catch {
    return {};
  }
}

export function rememberProjectMode(
  projectId: number,
  mode: ProjectAiMode
): void {
  try {
    const all = readAll();
    all[String(projectId)] = mode;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Private mode or full storage: the Coach just uses its default tone.
  }
}

export function readProjectMode(projectId: number): ProjectAiMode | undefined {
  if (typeof window === 'undefined') return undefined;
  const mode = readAll()[String(projectId)];
  return mode && MODES.includes(mode) ? mode : undefined;
}
