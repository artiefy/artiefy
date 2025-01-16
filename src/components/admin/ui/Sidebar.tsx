'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Info } from 'lucide-react';
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
} from 'react-icons/fi';
import { Button } from '~/components/admin/ui/button';
import { cn } from '~/lib/utils';

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsOpen(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItemsEducator = [
    {
      icon: <FiHome size={24} />,
      title: 'Inicio',
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
      icon: <FiUser size={24} />,
      title: 'Perfil',
      id: 'profile',
      link: '/profile',
    },
    {
      icon: <FiSettings size={24} />,
      title: 'Configuración',
      id: 'settings',
      link: '/settings',
    },
  ];

  const navItemsAdmin = [
    { icon: <FiHome size={24} />, title: 'Inicio', id: 'home', link: '/' },
    {
      icon: <FiBook size={24} />,
      title: 'Cursos',
      id: 'courses',
      link: '/cursos',
    },
    {
      icon: <FiFileText size={24} />,
      title: 'Proyectos',
      id: 'projects',
      link: '/proyectos',
    },
    {
      icon: <FiUser size={24} />,
      title: 'Perfil',
      id: 'profile',
      link: '/profile',
    },
    {
      icon: <FiSettings size={24} />,
      title: 'Configuración',
      id: 'settings',
      link: '/settings',
    },
  ];

  const navItems =
    user?.publicMetadata?.role === 'admin' ? navItemsAdmin : navItemsEducator;
  const [activeItem, setActiveItem] = useState('home');

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background shadow-sm">
        <div className="p-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => isMobile && setIsOpen(!isOpen)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-muted-foreground md:hidden"
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
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-yellow-300"
                title="Información"
              >
                <Info />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background pt-20 transition-transform dark:border-gray-700 sm:translate-x-0',
          !isOpen && '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div className="h-full overflow-y-auto bg-background px-3 pb-4">
          <ul className="space-y-5 font-medium">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.link}
                  onClick={() => setActiveItem(item.id)}
                  className={cn(
                    'group flex w-full items-center rounded-lg p-2 text-foreground hover:bg-accent',
                    activeItem === item.id
                      ? 'bg-primary text-primary-foreground'
                      : ''
                  )}
                >
                  <span className="text-muted-foreground transition duration-75 group-hover:text-foreground">
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
      <div className={cn('p-4 pt-20', isOpen ? 'sm:ml-64' : '')}>
        <div>{children}</div>
      </div>
    </div>
  );
}
