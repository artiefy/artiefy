import { auth, currentUser } from '@clerk/nextjs/server';

import { getUserRole } from '~/utils/roles';

import type { Roles } from '~/types/globals';

/**
 * Server-only auth helpers for API route handlers.
 *
 * Security best practice: the Clerk middleware does NOT protect `/api` routes,
 * so every handler that returns or mutates user-scoped data must authenticate
 * and authorize on its own. These helpers centralize that check so shared
 * endpoints (used by both students and staff) can enforce
 * "owner OR staff" without each route re-implementing role logic.
 */

const STAFF_ROLES: ReadonlySet<Roles> = new Set<Roles>([
  'admin',
  'educador',
  'super-admin',
]);

export interface ApiSession {
  userId: string | null;
  role: Roles | undefined;
  isStaff: boolean;
}

/**
 * Resolves the caller's identity and role. Falls back to the Clerk profile when
 * the session token does not carry the role claim, so staff members are never
 * misclassified as students (which would wrongly 403 an educator/admin).
 */
export async function getApiSession(): Promise<ApiSession> {
  const { userId, sessionClaims } = await auth();

  let role = getUserRole(sessionClaims?.metadata?.role);
  if (userId && !role) {
    const user = await currentUser();
    role = getUserRole(user?.publicMetadata?.role);
  }

  return {
    userId: userId ?? null,
    role,
    isStaff: role ? STAFF_ROLES.has(role) : false,
  };
}

export type AuthorizationResult =
  | { ok: true; userId: string; role: Roles | undefined; isStaff: boolean }
  | { ok: false; status: 401 | 403 };

/**
 * Allows the request only when the caller is authenticated AND holds one of the
 * given roles. Reuses the same role resolution as {@link getApiSession}.
 */
export async function authorizeRole(
  allowed: readonly Roles[]
): Promise<AuthorizationResult> {
  const session = await getApiSession();
  if (!session.userId) return { ok: false, status: 401 };
  if (!session.role || !allowed.includes(session.role)) {
    return { ok: false, status: 403 };
  }
  return {
    ok: true,
    userId: session.userId,
    role: session.role,
    isStaff: session.isStaff,
  };
}

/**
 * Allows the request only when the caller is authenticated staff
 * (educador/admin/super-admin).
 */
export async function authorizeStaff(): Promise<AuthorizationResult> {
  return authorizeRole(['admin', 'educador', 'super-admin']);
}

/**
 * Allows the request when the caller is authenticated AND is either the owner of
 * the resource (`userId === ownerId`) or a staff member (educador/admin/
 * super-admin). Returns a typed failure with the HTTP status otherwise.
 */
export async function authorizeOwnerOrStaff(
  ownerId: string | null | undefined
): Promise<AuthorizationResult> {
  const session = await getApiSession();
  if (!session.userId) return { ok: false, status: 401 };
  if (session.userId !== ownerId && !session.isStaff) {
    return { ok: false, status: 403 };
  }
  return {
    ok: true,
    userId: session.userId,
    role: session.role,
    isStaff: session.isStaff,
  };
}
