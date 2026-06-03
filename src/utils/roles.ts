import { type Roles } from '~/types/globals';

export const STUDENT_ROLE: Roles = 'estudiante';

const VALID_ROLES = new Set<Roles>([
  'admin',
  'educador',
  STUDENT_ROLE,
  'super-admin',
]);

export const getUserRole = (role: unknown): Roles | undefined =>
  typeof role === 'string' && VALID_ROLES.has(role as Roles)
    ? (role as Roles)
    : undefined;

export const ensureCurrentUserStudentRole = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/estudiantes/default-role', {
      method: 'POST',
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const getDashboardRouteByRole = (role?: Roles): string => {
  switch (role) {
    case 'super-admin':
      return '/dashboard/super-admin';
    case 'admin':
      return '/dashboard/admin';
    case 'educador':
      return '/dashboard/educadores';
    default:
      return '/estudiantes';
  }
};

export const getPrivilegedDashboardRoute = (role?: Roles): string | null => {
  switch (role) {
    case 'super-admin':
    case 'admin':
    case 'educador':
      return getDashboardRouteByRole(role);
    default:
      return null;
  }
};
