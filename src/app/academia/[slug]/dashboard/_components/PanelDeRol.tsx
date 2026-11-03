import { notFound, redirect } from 'next/navigation';

import { FiBook, FiBookOpen, FiHome, FiUsers } from 'react-icons/fi';

import { sesionEnAcademia } from '~/app/academia/_cache/academia';
import { LogoAcademia } from '~/components/academy/LogoAcademia';
import { SinAcceso } from '~/components/academy/SinAcceso';
import ResponsiveSidebar, { type ItemMenu } from '~/components/eduAndAdmiMenu';
import { type Academia } from '~/server/academy/academias';
import {
  ETIQUETA_ROL,
  RUTA_DASHBOARD,
  type UsuarioAcademia,
} from '~/server/academy/usuarios';
import { type AcademyRole } from '~/server/db/schema';

import type { Route } from 'next';

// Menú lateral de cada rol (mismo sidebar que el dashboard de Artiefy).
// Para el super-admin, la misma forma que el menú de super-admin de Artiefy
// (Cursos como grupo con sus secciones).
const MENU: Record<AcademyRole, ItemMenu[]> = {
  'super-admin': [
    {
      kind: 'link',
      id: 'inicio',
      icon: <FiHome size={18} />,
      title: 'Inicio',
      link: '/dashboard/super-admin',
    },
    {
      kind: 'link',
      id: 'usuarios',
      icon: <FiUsers size={18} />,
      title: 'Usuarios',
      link: '/dashboard/super-admin#usuarios',
    },
    {
      kind: 'group',
      id: 'cursos',
      icon: <FiBook size={18} />,
      title: 'Cursos',
      items: [
        { title: 'Todos los Cursos', link: '/dashboard/super-admin/cursos' },
        {
          title: 'Configuraciones',
          link: '/dashboard/super-admin/cursos/configuraciones',
        },
      ],
    },
  ],
  educador: [
    {
      kind: 'link',
      id: 'inicio',
      icon: <FiHome size={18} />,
      title: 'Inicio',
      link: '/dashboard/educator',
    },
    {
      kind: 'link',
      id: 'cursos',
      icon: <FiBookOpen size={18} />,
      title: 'Mis cursos',
      link: '/dashboard/educator#cursos',
    },
  ],
  estudiante: [
    {
      kind: 'link',
      id: 'inicio',
      icon: <FiHome size={18} />,
      title: 'Inicio',
      link: '/dashboard/student',
    },
    {
      kind: 'link',
      id: 'cursos',
      icon: <FiBookOpen size={18} />,
      title: 'Mis cursos',
      link: '/dashboard/student#cursos',
    },
  ],
};

/**
 * Estructura común de los paneles de una academia: el dashboard de Artiefy
 * (sidebar y barra superior) con el menú del rol. Exige una cuenta de ESTA
 * academia con el rol del panel; con otro rol, la manda a su propio panel.
 */
export async function PanelDeRol({
  params,
  rol,
  render,
  saludo = true,
}: {
  params: Promise<{ slug: string }>;
  rol: AcademyRole;
  // false en las subpáginas (cursos, configuraciones…): sin el "Hola".
  saludo?: boolean;
  render: (s: {
    academia: Academia;
    cuenta: UsuarioAcademia;
  }) => React.ReactNode;
}) {
  const sesion = await sesionEnAcademia((await params).slug);
  if (!sesion) notFound();
  const { academia, cuenta } = sesion;
  if (!cuenta) return <SinAcceso academia={academia} />;
  if (cuenta.role !== rol) redirect(RUTA_DASHBOARD[cuenta.role] as Route);

  return (
    <ResponsiveSidebar menu={MENU[rol]}>
      <main className="mx-auto max-w-6xl px-4 py-8 text-white sm:px-6">
        {saludo && (
          <div className="mb-8 flex items-center gap-4">
            <LogoAcademia {...academia} className="h-12 sm:h-14" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                Hola, {cuenta.name?.split(' ')[0] ?? 'bienvenido'}
              </h1>
              <p className="text-white/60">
                {academia.nombre} · {ETIQUETA_ROL[cuenta.role]}
              </p>
            </div>
          </div>
        )}
        {render({ academia, cuenta })}
      </main>
    </ResponsiveSidebar>
  );
}
