import type {
  ProjectAiMode,
  ProjectAiSeed,
} from '~/components/projects/Modals/ProjectModeChooser';

const STORAGE_KEY = 'artiefy:landing-pending-seed';
const MODES: readonly ProjectAiMode[] = ['guided', 'copilot', 'autonomous'];

/**
 * Keeps the idea a signed-out visitor sent from the landing until they sign
 * in. Session storage survives the OAuth round trip, which reloads the page.
 */
export function savePendingLandingSeed(seed: ProjectAiSeed) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    // Storage blocked or full: the idea is simply not carried over.
  }
}

/** Returns the saved idea once and forgets it. */
export function takePendingLandingSeed(): ProjectAiSeed | null {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<ProjectAiSeed>;
    if (
      typeof value.idea !== 'string' ||
      typeof value.details !== 'string' ||
      !MODES.includes(value.mode as ProjectAiMode)
    ) {
      return null;
    }
    return {
      idea: value.idea,
      details: value.details,
      mode: value.mode as ProjectAiMode,
    };
  } catch {
    return null;
  }
}
