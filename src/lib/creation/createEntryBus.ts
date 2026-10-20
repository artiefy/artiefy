'use client';

/**
 * The two things the "Crear" menu (desktop dropdown in `ProjectsLeftRail`)
 * and the "+" bottom sheet (mobile, `MobileCreateSheet`) can open.
 */
export type CreateEntryAction = 'project' | 'post';

const ALL_ACTIONS: readonly CreateEntryAction[] = ['project', 'post'];

const EVENT_NAME = 'artiefy:create-entry-request';
const STORAGE_KEY = 'artiefy:pending-create-entry';
const IDEA_STORAGE_KEY = 'artiefy:pending-create-idea';

/**
 * Routes whose page listens for each action. The project modals live in both
 * `ProjectsHomeView` (`/proyectos`) and `ProjectsSocialView` (`/explorar` and
 * its headerless twin `/estudiantes/proyectos`); the post modal only in the
 * social view. The first route is where a request from anywhere else goes.
 */
const CREATE_ENTRY_ROUTES = {
  project: ['/proyectos', '/explorar', '/estudiantes/proyectos'],
  post: ['/explorar', '/estudiantes/proyectos'],
} as const satisfies Record<CreateEntryAction, readonly string[]>;

/**
 * Where to navigate after `requestCreateEntry`, or `null` when the current
 * route already handles the action. Navigating away from a route that handles
 * it would unmount the modal its live listener has just opened.
 */
export function getCreateEntryRoute(
  action: CreateEntryAction,
  pathname: string
): (typeof CREATE_ENTRY_ROUTES)[CreateEntryAction][number] | null {
  const routes = CREATE_ENTRY_ROUTES[action];
  return (routes as readonly string[]).includes(pathname) ? null : routes[0];
}

/**
 * Requests that a creation flow open a specific modal.
 *
 * The bottom sheet lives in `MobileBottomNav`, mounted globally by `Header`
 * on every route, while the modals it triggers only exist on the routes in
 * `CREATE_ENTRY_ROUTES` — the same cross-tree gap
 * `agentChatBus.ts` solves for the agent chat widget, so this follows the
 * same DOM `CustomEvent` pattern rather than a React context that a
 * different-route tree wouldn't be part of yet.
 *
 * A query string is not an option here: `/proyectos`'s page component
 * redirects to `/estudiantes` whenever it sees ANY search param (its
 * `hasLegacyQuery` guard), so a `?create=` param would bounce the user away
 * before the page ever mounted. Instead, the request is also stashed in
 * `sessionStorage` so it survives the navigation and is consumed once the
 * target page mounts.
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

/**
 * Returns the unsubscribe function, ready to be a `useEffect` cleanup.
 * `accepted` limits the listener to the actions its page can open, so a
 * request meant for another route keeps its cross-route fallback.
 */
export function subscribeToCreateEntry(
  handler: (action: CreateEntryAction) => void,
  accepted: readonly CreateEntryAction[] = ALL_ACTIONS
): () => void {
  const listener = (event: Event) => {
    const action = (event as CustomEvent<CreateEntryAction>).detail;
    if (!accepted.includes(action)) return;
    // Handled live, so drop the cross-route fallback; otherwise the next
    // mount of the page (e.g. a reload) would reopen the modal.
    sessionStorage.removeItem(STORAGE_KEY);
    handler(action);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

/**
 * Reads and clears a pending request left by `requestCreateEntry` before a
 * cross-route navigation. Call once when the page mounts; a pending action
 * outside `accepted` is left for the page that handles it.
 */
export function consumePendingCreateEntry(
  accepted: readonly CreateEntryAction[] = ALL_ACTIONS
): CreateEntryAction | null {
  if (typeof window === 'undefined') return null;
  const pending = sessionStorage.getItem(STORAGE_KEY);
  if (!pending) return null;
  if (pending !== 'project' && pending !== 'post') {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  if (!accepted.includes(pending)) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  return pending;
}

/** Reads and clears the idea sent along with a `'project'` request. */
export function consumePendingCreateIdea(): string {
  if (typeof window === 'undefined') return '';
  const idea = sessionStorage.getItem(IDEA_STORAGE_KEY) ?? '';
  sessionStorage.removeItem(IDEA_STORAGE_KEY);
  return idea;
}
