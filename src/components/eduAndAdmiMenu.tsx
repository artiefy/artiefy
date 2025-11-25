'use client';
import { type JSX, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserButton, useUser } from '@clerk/clerk-react';
import {
  FaWhatsapp,
} from 'react-icons/fa';
import {
  FiBook,
  FiChevronDown,
  FiChevronRight,
  FiFileText,
  FiHome,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiShieldOff,
  FiUser,
  FiX,
} from 'react-icons/fi';

import { TicketNotificationBell } from '~/components/TicketNotificationBell';
import { useTicketsUnread } from '~/hooks/useTicketsUnread';
import { cn } from '~/lib/utils';

import { ModalError } from './educators/modals/modalError';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

const ResponsiveSidebar = ({ children }: ResponsiveSidebarProps) => {
  const { user } = useUser();
  const { totalUnread } = useTicketsUnread(); // ✅ Agregar esto

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const pathname = usePathname();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);


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

  const navItemsSuperAdmin = [
    {
      icon: <FiHome size={18} />,
      title: 'Usuarios y Roles',
      id: 'users',
      link: '/dashboard/super-admin',
    },
    {
      icon: <FiMessageSquare size={18} />,
      title: 'Foro',
      id: 'foro',
      link: '/dashboard/super-admin/foro',
    },
    {
      icon: <FiMessageSquare size={18} />,
      title: 'Tickets',
      id: 'tickets',
      link: '/dashboard/super-admin/tickets',
      badge: totalUnread > 0 ? totalUnread : undefined,
    },
    {
      icon: <FiShieldOff size={18} />,
      title: 'Roles Secundarios',
      id: 'roles-secundarios',
      link: '/dashboard/super-admin/usuariosRoles',
    },
    {
      icon: <FiFileText size={18} />,
      title: 'Logs credenciales',
      id: 'cred-logs',
      link: '/dashboard/super-admin/credentials-logs',
    },
  ];

  const navItemsEducator = [
    {
      icon: <FiHome size={18} />,
      title: 'Inicio',
      id: 'home',
      link: '/dashboard/educadores',
    },
    {
      icon: <FiBook size={18} />,
      title: 'Cursos',
      id: 'coursesd',
      link: '/dashboard/educadores/cursos',
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
  } else if (user?.publicMetadata?.role === 'super-admin') {
    navItems = navItemsSuperAdmin;
  }

  const [activeItem, setActiveItem] = useState('home');

  const shouldShowText = isMobile ? isOpen : isHovered;
  const sidebarWidth = shouldShowText ? 'w-56' : 'w-16';

  return (
    <div className="bg-background min-h-screen">
      {/* Navbar */}
      <nav className="bg-background fixed top-0 z-40 w-full border-b border-gray-200 shadow-xs">
        <div className="p-2.5 lg:px-4 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => isMobile && setIsOpen(!isOpen)}
                className="rounded-lg p-2 text-white hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-hidden md:hidden"
                aria-controls="sidebar"
                aria-expanded={isOpen}
              >
                {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
              <div className="flex items-center gap-2">
                <div className="relative size-[32px]">
                  <Image
                    src="/favicon.ico"
                    className="size-8 rounded-full object-contain"
                    alt="Educational Logo"
                    fill
                    sizes="32px"
                  />
                </div>
                <span className="self-center text-lg font-semibold tracking-tight sm:text-xl">
                  Artiefy
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ModalError
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
              />
              <TicketNotificationBell />
              <UserButton showName />
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={cn(
          'bg-background fixed top-0 left-0 z-30 h-screen border-r border-gray-200 pt-[52px] transition-all duration-300 dark:border-gray-700 dark:bg-gray-800',
          sidebarWidth,
          isMobile && !isOpen && '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div className="bg-background h-full overflow-y-auto overflow-x-hidden px-2 pb-4 dark:bg-gray-800">
          <ul className="space-y-1.5 font-medium mt-3">
            {navItems.map((item) => (
              <li key={item.id} onClick={item.onClick}>
                <Link
                  href={item.link ?? '#'}
                  onClick={() => setActiveItem(item.id)}
                  className={cn(
                    'hover:bg-primary group flex items-center rounded-lg p-2 text-white transition-all duration-200 relative',
                    activeItem === item.id && 'bg-primary text-black',
                    !shouldShowText && 'justify-center'
                  )}
                  title={!shouldShowText ? item.title : undefined}
                >
                  <span
                    className={cn(
                      'text-gray-300 transition duration-75 group-hover:text-gray-900 relative',
                      activeItem === item.id && 'text-black'
                    )}
                  >
                    {item.icon}
                    {/* ✅ Badge cuando el sidebar está CERRADO - aparece sobre el ícono */}
                    {!shouldShowText && item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white animate-pulse ring-1 ring-background">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </span>
                  {/* ✅ Badge cuando el sidebar está ABIERTO - aparece al final del texto */}
                  {shouldShowText && (
                    <span className="ml-2.5 flex items-center justify-between whitespace-nowrap text-xs font-medium flex-1">
                      {item.title}
                      {item.badge && item.badge > 0 && (
                        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white animate-pulse">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              </li>
            ))}

            {user?.publicMetadata?.role === 'super-admin' && (
              <>
                {/* Submenú: Formulario */}
                <li>
                  <button
                    onClick={() => shouldShowText && setIsFormOpen(!isFormOpen)}
                    className={cn(
                      'hover:bg-secondary flex w-full items-center rounded-lg p-2 text-white transition-all duration-300 hover:text-white',
                      !shouldShowText && 'justify-center'
                    )}
                    title={!shouldShowText ? 'Formulario' : undefined}
                  >
                    <FiFileText size={18} />
                    {shouldShowText && (
                      <>
                        <span className="ml-2.5 flex-1 whitespace-nowrap text-xs font-medium text-left">
                          Formulario
                        </span>
                        {isFormOpen ? (
                          <FiChevronDown size={16} />
                        ) : (
                          <FiChevronRight size={16} />
                        )}
                      </>
                    )}
                  </button>

                  {isFormOpen && shouldShowText && (
                    <ul className="mt-1 ml-4 space-y-0.5">
                      <li>
                        <Link
                          href="/dashboard/super-admin/form-inscription/dates"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/form-inscription/dates' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Fechas inscritas
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/form-inscription/comercials"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/form-inscription/comercials' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Comerciales registrados
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/form-inscription/horario"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/form-inscription/horario' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Horarios registrados
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/form-inscription/sedes"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/form-inscription/sedes' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Sedes
                        </Link>
                      </li>
                      <li>

                        <Link
                          href="/dashboard/super-admin/whatsapp/inbox?session=sesion2"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/whatsapp/inbox' && 'bg-primary text-[#01142B]'
                          )}
                        >
                          WhatsApp (Sesión 2)
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                {/* Submenú: WhatsApp */}
                <li>
                  <button
                    onClick={() => shouldShowText && setIsWhatsAppOpen(!isWhatsAppOpen)}
                    className={cn(
                      'hover:bg-secondary flex w-full items-center rounded-lg p-2 text-white transition-all duration-300 hover:text-white',
                      !shouldShowText && 'justify-center'
                    )}
                    title={!shouldShowText ? 'WhatsApp' : undefined}
                  >
                    <FaWhatsapp size={18} />
                    {shouldShowText && (
                      <>
                        <span className="ml-2.5 flex-1 whitespace-nowrap text-xs font-medium text-left">
                          WhatsApp
                        </span>
                        {isWhatsAppOpen ? (
                          <FiChevronDown size={16} />
                        ) : (
                          <FiChevronRight size={16} />
                        )}
                      </>
                    )}
                  </button>

                  {isWhatsAppOpen && shouldShowText && (
                    <ul className="mt-1 ml-4 space-y-0.5">
                      <li>
                        <Link
                          href="/dashboard/super-admin/whatsapp/soporte"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/whatsapp/soporte' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Soporte
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/whatsapp/sesion2"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/whatsapp/sesion2' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Sesión 2
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Submenú: Cursos */}
                <li>
                  <button
                    onClick={() => shouldShowText && setIsCoursesOpen(!isCoursesOpen)}
                    className={cn(
                      'hover:bg-secondary flex w-full items-center rounded-lg p-2 text-white transition-all duration-300 hover:text-white',
                      !shouldShowText && 'justify-center'
                    )}
                    title={!shouldShowText ? 'Cursos' : undefined}
                  >
                    <FiBook size={18} />
                    {shouldShowText && (
                      <>
                        <span className="ml-2.5 flex-1 whitespace-nowrap text-xs font-medium text-left">
                          Cursos
                        </span>
                        {isCoursesOpen ? (
                          <FiChevronDown size={16} />
                        ) : (
                          <FiChevronRight size={16} />
                        )}
                      </>
                    )}
                  </button>

                  {isCoursesOpen && shouldShowText && (
                    <ul className="mt-1 ml-4 space-y-0.5">
                      <li>
                        <Link
                          href="/dashboard/super-admin/cursos"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/cursos' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Todos los Cursos
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/courses/topFeature"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/courses/topFeature' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Top / Destacados
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/categories"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/categories' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Categorías
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/modalities"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/modalities' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Modalidades
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/difficulties"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/difficulties' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Niveles
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Submenú: Programas */}
                <li>
                  <button
                    onClick={() => shouldShowText && setIsProgramsOpen(!isProgramsOpen)}
                    className={cn(
                      'hover:bg-secondary flex w-full items-center rounded-lg p-2 text-white transition-all duration-300 hover:text-white',
                      !shouldShowText && 'justify-center'
                    )}
                    title={!shouldShowText ? 'Programas' : undefined}
                  >
                    <FiBook size={18} />
                    {shouldShowText && (
                      <>
                        <span className="ml-2.5 flex-1 whitespace-nowrap text-xs font-medium text-left">
                          Programas
                        </span>
                        {isProgramsOpen ? (
                          <FiChevronDown size={16} />
                        ) : (
                          <FiChevronRight size={16} />
                        )}
                      </>
                    )}
                  </button>

                  {isProgramsOpen && shouldShowText && (
                    <ul className="mt-1 ml-4 space-y-0.5">
                      <li>
                        <Link
                          href="/dashboard/super-admin/programs"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/programs' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Todos los programas
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/materias"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/materias' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Materias
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/super-admin/programs/enrolled_users"
                          className={cn(
                            'hover:bg-secondary block rounded-lg px-2 py-1.5 text-white transition-all duration-300 hover:text-white text-xs',
                            pathname === '/dashboard/super-admin/programs/enrolled_users' &&
                            'bg-primary text-[#01142B]'
                          )}
                        >
                          Matricular Estudiantes
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              </>
            )}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'pt-[52px] transition-all duration-300',
          !isMobile && (shouldShowText ? 'ml-56' : 'ml-16')
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveSidebar;