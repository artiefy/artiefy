'use client';

/**
 * The two things the "Crear" menu (desktop dropdown in `ProjectsLeftRail`)
 * and the "+" bottom sheet (mobile, `MobileCreateSheet`) can open.
 */
export type CreateEntryAction = 'project' | 'post';

const EVENT_NAME = 'artiefy:create-entry-request';
const STORAGE_KEY = 'artiefy:pending-create-entry';
const IDEA_STORAGE_KEY = 'artiefy:pending-create-idea';

/**
 * Requests that the `/proyectos` creation flow open a specific modal.
 *
 * The bottom sheet lives in `MobileBottomNav`, mounted globally by `Header`
 * on every route, while the modals it triggers only exist in
 * `ProjectsSocialView` on `/proyectos` — the same cross-tree gap
 * `agentChatBus.ts` solves for the agent chat widget, so this follows the
 * same DOM `CustomEvent` pattern rather than a React context that a
 * different-route tree wouldn't be part of yet.
 *
 * A query string is not an option here: `/proyectos`'s page component
 * redirects to `/estudiantes` whenever it sees ANY search param (its
 * `hasLegacyQuery` guard), so a `?create=` param would bounce the user away
 * before `ProjectsSocialView` ever mounted. Instead, the request is also
 * stashed in `sessionStorage` so it survives the navigation and is consumed
 * once `ProjectsSocialView` mounts.
 *
 * Desktop's "Crear" dropdown is already inside `ProjectsSocialView`'s own
 * tree, so its live event listener picks the dispatch up synchronously —
 * same function, same code path as the cross-route mobile case, just
 * without needing the `sessionStorage` fallback to actually do anything.
 */
export function requestCreateEntry(
  action: CreateEntryAction,
  options?: {
    /** Pre-fills the project idea, e.g. with what was typed in the search. */
    idea?: string;
  }
): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, action);
  // Unlike the action, the idea is only dropped once read: a live listener
  // and a post-navigation mount both pick it up through the same call.
  if (options?.idea) {
    sessionStorage.setItem(IDEA_STORAGE_KEY, options.idea);
  } else {
    sessionStorage.removeItem(IDEA_STORAGE_KEY);
  }
  window.dispatchEvent(
    new CustomEvent<CreateEntryAction>(EVENT_NAME, { detail: action })
  );
}

/** Returns the unsubscribe function, ready to be a `useEffect` cleanup. */
export function subscribeToCreateEntry(
  handler: (action: CreateEntryAction) => void
): () => void {
  const listener = (event: Event) => {
    // Handled live, so drop the cross-route fallback; otherwise the next
    // mount of `ProjectsSocialView` (e.g. a reload) would reopen the modal.
    sessionStorage.removeItem(STORAGE_KEY);
    handler((event as CustomEvent<CreateEntryAction>).detail);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

/**
 * Reads and clears a pending request left by `requestCreateEntry` before a
 * cross-route navigation. Call once when `ProjectsSocialView` mounts.
 */
export function consumePendingCreateEntry(): CreateEntryAction | null {
  if (typeof window === 'undefined') return null;
  const pending = sessionStorage.getItem(STORAGE_KEY);
  if (!pending) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  return pending === 'project' || pending === 'post' ? pending : null;
}

/** Reads and clears the idea sent along with a `'project'` request. */
export function consumePendingCreateIdea(): string {
  if (typeof window === 'undefined') return '';
  const idea = sessionStorage.getItem(IDEA_STORAGE_KEY) ?? '';
  sessionStorage.removeItem(IDEA_STORAGE_KEY);
  return idea;
}
