'use client';
import { type JSX, useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserButton, useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { FaGraduationCap, FaWhatsapp } from 'react-icons/fa';
import {
  FiAward,
  FiBook,
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLayers,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiShieldOff,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';

import { TicketNotificationBell } from '~/components/TicketNotificationBell';
import { useFinancialsSummary } from '~/hooks/useFinancialsSummary';
import { useTicketsUnread } from '~/hooks/useTicketsUnread';
import { cn } from '~/lib/utils';

import { ModalError } from './educators/modals/modalError';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

interface NavSubItem {
  title: string;
  link?: string;
}

interface NavLinkItem {
  kind: 'link';
  id: string;
  icon: JSX.Element;
  title: string;
  link: string;
  badge?: number;
}

interface NavPlaceholderItem {
  kind: 'placeholder';
  id: string;
  icon: JSX.Element;
  title: string;
}

interface NavGroupItem {
  kind: 'group';
  id: string;
  icon: JSX.Element;
  title: string;
  extra?: JSX.Element;
  items: NavSubItem[];
}

type SuperAdminNavItem = NavLinkItem | NavPlaceholderItem | NavGroupItem;

const ResponsiveSidebar = ({ children }: ResponsiveSidebarProps) => {
  const { user } = useUser();
  const { totalUnread } = useTicketsUnread(); // ✅ Agregar esto
  const { totalRecaudado } = useFinancialsSummary(); // ✅ Total recaudado

  const sidebarUserName =
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    'Usuario';
  const sidebarUserInitial = sidebarUserName.charAt(0).toUpperCase();

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  const toggleMenu = (id: string) =>
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItemsEducator = [
    {
      icon: <FiHome size={18} />,
      title: 'Inicio',
      id: 'home',
      link: '/dashboard/educadores',
    },
    {
      icon: <FiFileText size={18} />,
      title: 'Proyectos',
      id: 'resources',
      link: '/dashboard/educadores/proyectos',
    },
    {
      icon: <FiMessageSquare size={18} />,
      title: 'Foros',
      id: 'forum',
      link: '/dashboard/educadores/foro',
    },
    {
      icon: <FiUser size={18} />,
      title: 'Perfil',
      id: 'profile',
      link: '/',
    },
    {
      icon: <FiShieldOff size={18} />,
      title: 'Reportar errores',
      id: 'errores',
      onClick: () => setIsModalOpen(true),
    },
    {
      icon: <FiSettings size={18} />,
      title: 'Configuraciones',
      id: 'settings',
      link: '/',
    },
  ];

  const navItemsAdmin = [
    {
      icon: <FiHome size={18} />,
      title: 'Home',
      id: 'home',
      link: '/dashboard/admin',
    },
    {
      icon: <FiBook size={18} />,
      title: 'Cursos',
      id: 'courses',
      link: '/dashboard/admin/cursos',
    },
    {
      icon: <FiFileText size={18} />,
      title: 'Proyectos',
      id: 'Proyectos',
      link: '/dashboard/admin2/app/proyectos',
    },
    {
      icon: <FiUser size={18} />,
      title: 'Perfil',
      id: 'profile',
      link: '/dashboard/admin2/app/perfil',
    },
    {
      icon: <FiSettings size={18} />,
      title: 'Configuraciones',
      id: 'settings',
      link: '/dashboard/admin2/app/configuracion',
    },
    {
      icon: <FiMessageSquare size={18} />,
      title: 'Foro',
      id: 'foro',
      link: '/dashboard/admin/foro',
    },
    {
      icon: <FiMessageSquare size={18} />,
      title: 'Tickets',
      id: 'tickets',
      link: '/dashboard/admin/tickets',
    },
  ];

  let navItems: {
    icon: JSX.Element;
    title: string;
    id: string;
    link?: string;
    onClick?: () => void;
    badge?: number;
  }[] = [];

  if (user?.publicMetadata?.role === 'admin') {
    navItems = navItemsAdmin;
  } else if (user?.publicMetadata?.role === 'educador') {
    navItems = navItemsEducator;
  }

  const superAdminNav: SuperAdminNavItem[] = [
    {
      kind: 'placeholder',
      id: 'inicio',
      icon: <FiHome size={18} />,
      title: 'Inicio',
    },
    {
      kind: 'group',
      id: 'usuarios-roles',
      icon: <FiUsers size={18} />,
      title: 'Usuarios y Roles',
      items: [
        { title: 'Todos', link: '/dashboard/super-admin' },
        {
          title: 'Roles Secundarios',
          link: '/dashboard/super-admin/usuariosRoles',
        },
      ],
    },
    {
      kind: 'link',
      id: 'tickets',
      icon: <FiMessageSquare size={18} />,
      title: 'Tickets',
      link: '/dashboard/super-admin/tickets',
      badge: totalUnread > 0 ? totalUnread : undefined,
    },
    {
      kind: 'group',
      id: 'estudiantes',
      icon: <FaGraduationCap size={18} />,
      title: 'Estudiantes',
      items: [
        {
          title: 'Lista de Estudiantes',
          link: '/dashboard/super-admin/programs/enrolled_users',
        },
        { title: 'Grupos' },
        {
          title: 'Logs credenciales',
          link: '/dashboard/super-admin/credentials-logs',
        },
        {
          title: 'Control de Accesos',
          link: '/dashboard/super-admin/subscription',
        },
      ],
    },
    {
      kind: 'group',
      id: 'proyectos',
      icon: <FiFileText size={18} />,
      title: 'Proyectos',
      items: [
        {
          title: 'Proyectos de Estudiantes',
          link: '/dashboard/super-admin/projects',
        },
        {
          title: 'Proyectos Guiados',
          link: '/dashboard/super-admin/proyectos-guiados',
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
          title: 'Top / Destacados',
          link: '/dashboard/super-admin/courses/topFeature',
        },
        { title: 'Categorías', link: '/dashboard/super-admin/categories' },
        { title: 'Modalidades', link: '/dashboard/super-admin/modalities' },
        { title: 'Niveles', link: '/dashboard/super-admin/difficulties' },
        { title: 'Horarios', link: '/dashboard/subscription/schedule-options' },
        { title: 'Espacios', link: '/dashboard/subscription/space-options' },
        {
          title: 'Tipos de Certificación',
          link: '/dashboard/super-admin/cursos/certification-types',
        },
        { title: 'Parámetros', link: '/dashboard/super-admin/parametros' },
        {
          title: 'Plantillas',
          link: '/dashboard/super-admin/parametros/plantillas',
        },
      ],
    },
    {
      kind: 'group',
      id: 'programas',
      icon: <FiLayers size={18} />,
      title: 'Programas',
      items: [
        {
          title: 'Todos los programas',
          link: '/dashboard/super-admin/programs',
        },
        { title: 'Materias', link: '/dashboard/super-admin/materias' },
      ],
    },
    {
      kind: 'group',
      id: 'finanzas',
      icon: <FiCreditCard size={18} />,
      title: 'Finanzas',
      extra:
        totalRecaudado > 0 ? (
          <span
            className="
              rounded bg-green-500/20 px-1.5 py-0.5 text-[10px]
              font-semibold whitespace-nowrap text-green-400
            "
          >
            ${(totalRecaudado / 1000000).toFixed(1)}M
          </span>
        ) : undefined,
      items: [
        {
          title: 'Historial de Transacciones',
          link: '/dashboard/transaction-history',
        },
        {
          title: 'Sesión 2',
          link: '/dashboard/super-admin/whatsapp/sesion2',
        },
      ],
    },
    {
      kind: 'group',
      id: 'whatsapp',
      icon: <FaWhatsapp size={18} />,
      title: 'WhatsApp',
      items: [
        { title: 'Soporte', link: '/dashboard/super-admin/whatsapp/soporte' },
      ],
    },
    {
      kind: 'link',
      id: 'foros',
      icon: <FiMessageSquare size={18} />,
      title: 'Foros',
      link: '/dashboard/super-admin/foro',
    },
    {
      kind: 'placeholder',
      id: 'educacion',
      icon: <FiBookOpen size={18} />,
      title: 'Educación',
    },
    {
      kind: 'placeholder',
      id: 'academy',
      icon: <FiAward size={18} />,
      title: 'Academy',
    },
    {
      kind: 'group',
      id: 'formulario',
      icon: <FiFileText size={18} />,
      title: 'Formulario',
      items: [
        {
          title: 'Fechas inscritas',
          link: '/dashboard/super-admin/form-inscription/dates',
        },
        {
          title: 'Comerciales registrados',
          link: '/dashboard/super-admin/form-inscription/comercials',
        },
        {
          title: 'Horarios registrados',
          link: '/dashboard/super-admin/form-inscription/horario',
        },
        {
          title: 'Sedes',
          link: '/dashboard/super-admin/form-inscription/sedes',
        },
      ],
    },
  ];

  const [activeItem, setActiveItem] = useState('home');

  // El resaltado de los items reales (con ruta) se calcula a partir de
  // `pathname`; `activeItem` solo sirve para los placeholders sin ruta
  // (Inicio, Educación, Academy, etc.), así que se limpia en cada navegación
  // para que no quede un item viejo marcado junto con la ruta actual.
  useEffect(() => {
    setActiveItem('');
  }, [pathname]);

  const shouldShowText = isMobile ? isOpen : isHovered;
  const sidebarWidth = shouldShowText ? 'w-56' : 'w-16';

  const renderSubItem = (sub: NavSubItem, idx: number) => {
    if (!sub.link) {
      return (
        <li key={idx}>
          <span
            className="
              flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5
              text-xs text-gray-500
            "
          >
            <span className="size-1 shrink-0 rounded-full bg-gray-600" />
            {sub.title}
          </span>
        </li>
      );
    }
    const isActive = pathname === sub.link;
    return (
      <li key={idx}>
        <Link
          href={sub.link}
          className={cn(
            `
              flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs
              text-white transition-all duration-300
              hover:text-primary
            `,
            isActive && 'text-primary'
          )}
        >
          <span
            className={cn(
              'size-1 shrink-0 rounded-full bg-gray-500',
              isActive && 'bg-primary'
            )}
          />
          {sub.title}
        </Link>
      </li>
    );
  };

  const renderSuperAdminItem = (item: SuperAdminNavItem) => {
    if (item.kind === 'placeholder') {
      const isActive = activeItem === item.id;
      return (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => setActiveItem(item.id)}
            className={cn(
              `
                group relative flex w-full items-center rounded-lg p-2
                text-white transition-all duration-200
                hover:bg-primary hover:text-black
              `,
              !shouldShowText && 'justify-center'
            )}
            title={!shouldShowText ? item.title : undefined}
          >
            {isActive && (
              <span
                className="
                  absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2
                  rounded-r bg-primary
                "
              />
            )}
            <span
              className={cn(
                `
                  relative transition duration-75
                  group-hover:text-black
                `,
                isActive ? 'text-primary' : 'text-gray-300'
              )}
            >
              {item.icon}
            </span>
            {shouldShowText && (
              <span
                className={cn(
                  `
                    ml-2.5 flex-1 text-left text-xs font-medium
                    whitespace-nowrap
                  `,
                  isActive && 'text-primary'
                )}
              >
                {item.title}
              </span>
            )}
          </button>
        </li>
      );
    }

    if (item.kind === 'link') {
      const isActive = pathname === item.link;
      return (
        <li key={item.id}>
          <Link
            href={item.link}
            className={cn(
              `
                group relative flex items-center rounded-lg p-2 text-white
                transition-all duration-200
                hover:bg-primary hover:text-black
              `,
              !shouldShowText && 'justify-center'
            )}
            title={!shouldShowText ? item.title : undefined}
          >
            {isActive && (
              <span
                className="
                  absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2
                  rounded-r bg-primary
                "
              />
            )}
            <span
              className={cn(
                `
                  relative transition duration-75
                  group-hover:text-black
                `,
                isActive ? 'text-primary' : 'text-gray-300'
              )}
            >
              {item.icon}
              {!shouldShowText && item.badge && item.badge > 0 && (
                <span
                  className="
                    absolute -top-2 -right-2 flex h-4 min-w-[16px]
                    animate-pulse items-center justify-center rounded-full
                    bg-red-600 px-1 text-[9px] font-bold text-white ring-1
                    ring-background
                  "
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </span>
            {shouldShowText && (
              <span
                className={cn(
                  'ml-2.5 flex items-center text-xs font-medium whitespace-nowrap',
                  isActive && 'text-primary'
                )}
              >
                {item.title}
                {item.badge && item.badge > 0 && (
                  <span
                    className="
                      ml-2 flex h-5 min-w-[20px] animate-pulse items-center
                      justify-center rounded-full bg-red-600 px-1.5 text-[10px]
                      font-bold text-white
                    "
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
            )}
          </Link>
        </li>
      );
    }

    const isMenuOpen = !!openMenus[item.id];
    const hasActiveChild = item.items.some(
      (sub) => sub.link && pathname === sub.link
    );
    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => shouldShowText && toggleMenu(item.id)}
          className={cn(
            `
              group relative flex w-full items-center rounded-lg p-2
              text-white transition-all duration-300
              hover:bg-secondary hover:text-white
            `,
            !shouldShowText && 'justify-center'
          )}
          title={!shouldShowText ? item.title : undefined}
        >
          {hasActiveChild && (
            <span
              className="
                absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r
                bg-primary
              "
            />
          )}
          <span className={hasActiveChild ? 'text-primary' : 'text-gray-300'}>
            {item.icon}
          </span>
          {shouldShowText && (
            <>
              <span
                className={cn(
                  'ml-2.5 w-32 shrink-0 text-left text-xs font-medium whitespace-nowrap',
                  hasActiveChild && 'text-primary'
                )}
              >
                {item.title}
              </span>
              <div className="flex items-center gap-2">
                {item.extra}
                {isMenuOpen ? (
                  <FiChevronDown size={16} />
                ) : (
                  <FiChevronRight size={16} />
                )}
              </div>
            </>
          )}
        </button>
        <AnimatePresence initial={false}>
          {isMenuOpen && shouldShowText && (
            <motion.ul
              key="submenu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="ml-4 space-y-0.5 overflow-hidden"
            >
              {item.items.map(renderSubItem)}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay para cerrar sidebar en móvil */}
      {isMobile && isOpen && (
        <div
          className="
            backdrop-blur-s fixed inset-0 z-40 bg-white/10
            md:hidden
          "
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Degradado oscuro tipo vignette detrás del sidebar al expandirse: se
          funde con el contenido sin dejar ninguna línea o caja visible */}
      {!isMobile && shouldShowText && (
        <div
          className="
            pointer-events-none fixed inset-0 z-30
            bg-gradient-to-r from-black via-black/80 to-transparent
            transition-opacity duration-300
          "
          style={{
            backgroundSize: '420px 100%',
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />
      )}

      {/* Botón X arriba a la izquierda solo en móvil+abierto */}
      {isMobile && isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="
            fixed top-4 left-4 z-60 rounded-lg bg-gray-900/80 p-2 text-white
            hover:bg-gray-800
            focus:ring-2 focus:ring-gray-200 focus:outline-hidden
            md:hidden
          "
          aria-controls="sidebar"
          aria-expanded={isOpen}
        >
          <FiX size={24} />
        </button>
      )}
      {/* Navbar */}
      <nav
        className="
          fixed top-0 z-40 w-full bg-transparent
        "
      >
        <div
          className="
            py-2.5 pr-2.5 pl-3
            lg:pr-4
          "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Botón menú hamburguesa solo en móvil+cerrado */}
              {isMobile && !isOpen && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="
                    rounded-lg p-2 text-white
                    hover:bg-gray-100
                    focus:ring-2 focus:ring-gray-200 focus:outline-hidden
                    md:hidden
                  "
                  aria-controls="sidebar"
                  aria-expanded={isOpen}
                >
                  <FiMenu size={20} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div
                  className="
                    flex size-8 shrink-0 items-center justify-center
                    rounded-full bg-primary text-sm font-bold text-black
                  "
                >
                  {sidebarUserInitial}
                </div>
                {shouldShowText && (
                  <span className="truncate text-sm font-semibold text-white">
                    {sidebarUserName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ModalError
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
              />
              <TicketNotificationBell />
              <UserButton
                showName
                appearance={{
                  elements: {
                    userButtonBox: '!flex-row-reverse',
                    userButtonAvatarBox: '!size-8 !rounded-full !bg-primary',
                    userButtonOuterIdentifier:
                      '!text-sm !font-bold !text-white',
                  },
                  variables: {
                    colorForeground: '#000000',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={cn(
          `
            fixed top-[52px] left-0 z-40 flex h-[calc(100vh-52px)] flex-col
            transition-all duration-300
          `,
          shouldShowText ? 'bg-transparent' : 'bg-background dark:bg-gray-800',
          sidebarWidth,
          isMobile && !isOpen && '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div
          className="
            min-h-0 flex-1
            scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent overflow-x-hidden
            overflow-y-auto
            bg-transparent px-2 pb-4 transition-colors duration-200 hover:scrollbar-thumb-gray-500
          "
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4b5563 transparent',
          }}
        >
          <ul className="mt-3 space-y-1.5 font-medium">
            {navItems.map((item) => {
              const isActive = item.link
                ? pathname === item.link
                : activeItem === item.id;
              return (
                <li key={item.id} onClick={item.onClick}>
                  <Link
                    href={item.link ?? '#'}
                    onClick={() => setActiveItem(item.id)}
                    className={cn(
                      `
                      group relative flex items-center rounded-lg p-2 text-white
                      transition-all duration-200
                      hover:bg-primary hover:text-black
                    `,
                      !shouldShowText && 'justify-center'
                    )}
                    title={!shouldShowText ? item.title : undefined}
                  >
                    {isActive && (
                      <span
                        className="
                        absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2
                        rounded-r bg-primary
                      "
                      />
                    )}
                    <span
                      className={cn(
                        `
                        relative transition duration-75
                        group-hover:text-black
                      `,
                        isActive ? 'text-primary' : 'text-gray-300'
                      )}
                    >
                      {item.icon}
                      {/* ✅ Badge cuando el sidebar está CERRADO - aparece sobre el ícono */}
                      {!shouldShowText && item.badge && item.badge > 0 && (
                        <span
                          className="
                          absolute -top-2 -right-2 flex h-4 min-w-[16px]
                          animate-pulse items-center justify-center rounded-full
                          bg-red-600 px-1 text-[9px] font-bold text-white ring-1
                          ring-background
                        "
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </span>
                    {/* ✅ Badge cuando el sidebar está ABIERTO - aparece al final del texto */}
                    {shouldShowText && (
                      <span
                        className={cn(
                          'ml-2.5 flex items-center text-xs font-medium whitespace-nowrap',
                          isActive && 'text-primary'
                        )}
                      >
                        {item.title}
                        {item.badge && item.badge > 0 && (
                          <span
                            className="
                            ml-2 flex h-5 min-w-[20px] animate-pulse
                            items-center justify-center rounded-full bg-red-600
                            px-1.5 text-[10px] font-bold text-white
                          "
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

            {user?.publicMetadata?.role === 'super-admin' &&
              superAdminNav.map(renderSuperAdminItem)}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'pt-[52px] transition-all duration-300',
          !isMobile && 'ml-16'
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveSidebar;
