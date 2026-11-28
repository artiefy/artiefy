'use client';

import { usePathname } from 'next/navigation';

/**
 * Panel desde el que se usa una pantalla compartida de gestión de cursos:
 * super-admin (todos los cursos) o educador (solo los suyos, como en
 * Artiefy). Da las rutas base de cada uno.
 */
export function usePanelAcademia() {
  const esEducador = usePathname().startsWith('/dashboard/educator');
  return {
    esEducador,
    inicio: esEducador ? '/dashboard/educator' : '/dashboard/super-admin',
    cursos: esEducador
      ? '/dashboard/educator'
      : '/dashboard/super-admin/cursos',
    curso: (id: number) =>
      esEducador
        ? `/dashboard/educator/cursos/${id}`
        : `/dashboard/super-admin/cursos/${id}`,
  };
}
