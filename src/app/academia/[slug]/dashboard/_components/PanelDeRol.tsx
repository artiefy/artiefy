import { notFound, redirect } from 'next/navigation';

import { FaGraduationCap } from 'react-icons/fa';
import {
  FiBook,
  FiBookOpen,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLayers,
  FiMessageSquare,
  FiUsers,
} from 'react-icons/fi';

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
// Para el super-admin, la misma forma que el menú de super-admin de Artiefy,
// solo con las secciones de la academia. Las que aún no existen muestran
// "Próximamente" (super-admin/[...seccion]).
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
      kind: 'group',
      id: 'usuarios-roles',
      icon: <FiUsers size={18} />,
      title: 'Usuarios y Roles',
      items: [
        { title: 'Todos', link: '/dashboard/super-admin/usuarios' },
        {
          title: 'Roles Secundarios',
          link: '/dashboard/super-admin/roles-secundarios',
        },
      ],
    },
    {
      kind: 'link',
      id: 'tickets',
      icon: <FiMessageSquare size={18} />,
      title: 'Tickets',
      link: '/dashboard/super-admin/tickets',
    },
    {
      kind: 'group',
      id: 'estudiantes',
      icon: <FaGraduationCap size={18} />,
      title: 'Estudiantes',
      items: [
        {
          title: 'Lista de Estudiantes',
          link: '/dashboard/super-admin/estudiantes',
        },
        { title: 'Grupos', link: '/dashboard/super-admin/estudiantes/grupos' },
        { title: 'Logs', link: '/dashboard/super-admin/estudiantes/logs' },
      ],
    },
    // Igual que el grupo "Formulario" de Artiefy.
    {
      kind: 'group',
      id: 'formulario',
      icon: <FiClipboard size={18} />,
      title: 'Formulario',
      items: [
        {
          title: 'Formulario de inscripción',
          link: '/dashboard/super-admin/estudiantes/formulario',
        },
        {
          title: 'Fechas inscritas',
          link: '/dashboard/super-admin/estudiantes/formulario#fechas',
        },
        {
          title: 'Comerciales registrados',
          link: '/dashboard/super-admin/estudiantes/formulario#comerciales',
        },
        {
          title: 'Horarios registrados',
          link: '/dashboard/super-admin/cursos/configuraciones?tab=horarios',
        },
        {
          title: 'Sedes',
          link: '/dashboard/super-admin/cursos/configuraciones?tab=espacios',
        },
      ],
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
    {
      kind: 'link',
      id: 'proyectos',
      icon: <FiFileText size={18} />,
      title: 'Proyectos',
      link: '/dashboard/super-admin/proyectos',
    },
    {
      kind: 'link',
      id: 'programas',
      icon: <FiLayers size={18} />,
      title: 'Programas',
      link: '/dashboard/super-admin/programas',
    },
    {
      kind: 'link',
      id: 'finanzas',
      icon: <FiCreditCard size={18} />,
      title: 'Finanzas',
      link: '/dashboard/super-admin/finanzas',
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
  anchoCompleto = false,
}: {
  params: Promise<{ slug: string }>;
  rol: AcademyRole;
  // false en las subpáginas (cursos, configuraciones…): sin el "Hola".
  saludo?: boolean;
  // true: sin el ancho máximo (pantallas tipo hoja, como la de estudiantes).
  anchoCompleto?: boolean;
  render: (s: {
    academia: Academia;
    cuenta: UsuarioAcademia;
  }) => React.ReactNode;
}) {
  const sesion = await sesionEnAcademia((await params).slug);
  if (!sesion) notFound();
  const { academia, cuenta } = sesion;
  if (!cuenta) {
    return <SinAcceso academia={academia} desactivada={sesion.desactivada} />;
  }
  if (cuenta.role !== rol) redirect(RUTA_DASHBOARD[cuenta.role] as Route);

  return (
    <ResponsiveSidebar menu={MENU[rol]}>
      <main
        className={
          anchoCompleto
            ? 'w-full p-4 text-white sm:px-6'
            : 'mx-auto max-w-6xl px-4 py-8 text-white sm:px-6'
        }
      >
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
