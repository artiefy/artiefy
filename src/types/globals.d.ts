export {};

// 🔹 Definir roles posibles
export type Roles = 'admin' | 'educador' | 'estudiante' | 'super-admin';

// 🔹 Definir permisos globales (20 permisos aleatorios)
export type AppPermissions =
  | 'manage_users'
  | 'view_reports'
  | 'edit_content'
  | 'delete_content'
  | 'manage_courses'
  | 'assign_roles'
  | 'moderate_forums'
  | 'access_financials'
  | 'export_data'
  | 'manage_settings'
  | 'create_announcements'
  | 'schedule_events'
  | 'view_sensitive_data'
  | 'issue_refunds'
  | 'manage_subscriptions'
  | 'send_notifications'
  | 'manage_support_tickets'
  | 'configure_integrations'
  | 'access_developer_tools'
  | 'override_permissions';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
      permissions?: AppPermissions[]; // ✅ Agregar permisos a la sesión
      isNewUser?: boolean;
    };
    fullName?: string;
    primaryEmail?: string;
  }
}
