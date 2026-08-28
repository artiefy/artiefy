/**
 * Permiso para eliminar cursos — parte compartida.
 *
 * Borrar un curso arrastra sus clases, actividades, notas y archivos en S3, y
 * no se puede deshacer. Por eso la acción no está disponible para cualquier
 * super-admin: queda restringida a una única cuenta.
 *
 * Este archivo NO importa nada del servidor a propósito: lo usa también el
 * componente cliente que decide si muestra el botón. La verificación real
 * vive en `course-deletion.server.ts`.
 */

/** Única cuenta autorizada a eliminar cursos. */
export const CORREO_AUTORIZADO_ELIMINAR_CURSO = 'lmsg829@gmail.com';

/** Comparación tolerante a mayúsculas y espacios. */
export function esCorreoAutorizado(correo?: string | null): boolean {
  return (
    (correo ?? '').trim().toLowerCase() === CORREO_AUTORIZADO_ELIMINAR_CURSO
  );
}

export type ResultadoPermiso =
  { ok: true } | { ok: false; status: number; error: string };
