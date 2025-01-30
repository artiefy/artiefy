import { useState, useEffect } from 'react';
import type { JSX } from 'react';

import { UserButton, useUser } from '@clerk/clerk-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FiHome,
  FiBook,
  FiFileText,
  FiUser,
  FiSettings,
  FiMenu,
  FiX,
  FiMessageSquare,
  FiShieldOff,
} from 'react-icons/fi';

import { cn } from '~/lib/utils'; // Asegúrate de tener la función 'cn' para clases condicionales.

import { ModalError } from './educators/modals/modalError';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

const ResponsiveSidebar = ({ children }: ResponsiveSidebarProps) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsOpen(window.innerWidth > 768); // Permite que la barra lateral esté abierta en desktop
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItemsEducator = [
    {
      icon: <FiHome size={24} />,
      title: 'Home',
      id: 'home',
      link: '/dashboard/educadores',
    },
    {
      icon: <FiBook size={24} />,
      title: 'Cursos',
      id: 'courses',
      link: '/dashboard/educadores/cursos',
    },
    {
      icon: <FiFileText size={24} />,
      title: 'Proyectos',
      id: 'resources',
      link: '/dashboard/educadores/proyectos',
    },
    {
      icon: <FiMessageSquare size={24} />,
      title: 'Forum',
      id: 'forum',
      link: '/dashboard/educadores/foro',
    },
    { icon: <FiUser size={24} />, title: 'Profile', id: 'profile', link: '/' },
    {
      icon: <FiShieldOff size={24} />,
      title: 'Reporta errores',
      id: 'errores',
      onClick: () => setIsModalOpen(true),
    },

    {
      icon: <FiSettings size={24} />,
      title: 'Settings',
      id: 'settings',
      link: '/',
    },
  ];

  const navItemsAdmin = [
    {
      icon: <FiHome size={24} />,
      title: 'Home',
      id: 'home',
      link: '/',
    },
    {
      icon: <FiBook size={24} />,
      title: 'Courses',
      id: 'courses',
      link: '/',
    },
    {
      icon: <FiFileText size={24} />,
      title: 'Proyectos',
      id: 'Proyectos',
      link: '/',
    },
    { icon: <FiUser size={24} />, title: 'Profile', id: 'profile', link: '/' },
    {
      icon: <FiSettings size={24} />,
      title: 'Settings',
      id: 'settings',
      link: '/',
    },
    {
      icon: <FiSettings size={24} />,
      title: 'Foro',
      id: 'foro',
      link: '/dashboard/admin/foro',
    },
  ];

  // Determina el rol del usuario y selecciona los elementos de navegación correspondientes
  let navItems: {
    icon: JSX.Element;
    title: string;
    id: string;
    link?: string;
    onClick?: () => void;
  }[] = [];
  if (user?.publicMetadata?.role === 'admin') {
    navItems = navItemsAdmin;
  } else if (user?.publicMetadata?.role === 'educador') {
    navItems = navItemsEducator;
  }
  const [activeItem, setActiveItem] = useState('home');

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-background shadow-sm">
        <div className="p-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => isMobile && setIsOpen(!isOpen)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden"
                aria-controls="sidebar"
                aria-expanded={isOpen}
              >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
              <div className="ml-2 flex md:mr-24">
                <div className="relative size-[38px]">
                  <Image
                    src="/favicon.ico"
                    className="size-8 rounded-full object-contain"
                    alt="Educational Logo"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 150px"
                  />
                </div>

                <span className="ml-2 self-center text-xl font-semibold sm:text-2xl">
                  Artiefy
                </span>
              </div>
            </div>
            <div className="absolute right-4">
              <ModalError
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
              />
              <UserButton showName />
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-background pt-20 transition-transform dark:border-gray-700 dark:bg-gray-800 sm:translate-x-0',
          !isOpen && '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div className="h-full overflow-y-auto bg-background px-3 pb-4">
          <ul className="space-y-5 font-medium">
            {navItems.map((item) => (
              <li key={item.id} onClick={item.onClick}>
                <Link
                  href={item.link ?? '#'}
                  onClick={() => setActiveItem(item.id)}
                  className={cn(
                    'group flex w-full items-center rounded-lg p-2 text-white hover:bg-primary',
                    activeItem === item.id ? 'bg-primary text-black' : ''
                  )}
                >
                  <span
                    className={cn(
                      `text-gray-300 transition duration-75 group-hover:text-gray-900`,
                      activeItem === item.id ? 'text-black' : ''
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={cn('ml-3', !isOpen && isMobile ? 'hidden' : '')}
                  >
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`p-4 ${isOpen ? 'sm:ml-64' : ''} pt-20`}>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ResponsiveSidebar;
