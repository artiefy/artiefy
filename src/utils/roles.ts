import { type Roles } from '~/types/globals';

export const getUserRole = (role: unknown): Roles | undefined =>
  typeof role === 'string' ? (role as Roles) : undefined;

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
