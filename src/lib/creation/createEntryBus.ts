'use client';

/**
 * The two things the "Crear" menu (desktop dropdown in `ProjectsLeftRail`)
 * and the "+" bottom sheet (mobile, `MobileCreateSheet`) can open.
 */
export type CreateEntryAction = 'project' | 'post';

const EVENT_NAME = 'artiefy:create-entry-request';
const STORAGE_KEY = 'artiefy:pending-create-entry';

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
export function requestCreateEntry(action: CreateEntryAction): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, action);
  window.dispatchEvent(
    new CustomEvent<CreateEntryAction>(EVENT_NAME, { detail: action })
  );
}

/** Returns the unsubscribe function, ready to be a `useEffect` cleanup. */
export function subscribeToCreateEntry(
  handler: (action: CreateEntryAction) => void
): () => void {
  const listener = (event: Event) => {
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
