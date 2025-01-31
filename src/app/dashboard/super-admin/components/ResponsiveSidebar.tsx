'use client';

import { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 🔥 Importar usePathname para detectar la ruta activa
import {
  FiHome,
  FiBook,
  FiSettings,
  FiArchive,
  FiMenu,
  FiX,
} from 'react-icons/fi';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

const ResponsiveSidebar = ({ children }: ResponsiveSidebarProps) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname(); // 🔥 Obtener la ruta actual

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsOpen(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Definir los elementos del menú
  const navItems = [
    { icon: <FiHome size={24} />, title: 'Dashboard', id: 'home', link: '/dashboard/super-admin' },
    { icon: <FiBook size={24} />, title: 'Cursos', id: 'cursos', link: '/dashboard/super-admin/cursos' },
    { icon: <FiSettings size={24} />, title: 'Configuraciones', id: 'settings', link: '/dashboard/super-admin/settings' },
    { icon: <FiArchive size={24} />, title: 'Roles', id: 'roles', link: '/dashboard/super-admin/roles' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Barra superior */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-background shadow-sm">
        <div className="flex justify-between p-3 lg:px-5 lg:pl-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-controls="sidebar"
            aria-expanded={isOpen}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <div className="flex items-center">
            <Image src="/favicon.ico" width={38} height={38} alt="Logo" />
            <span className="ml-2 text-xl font-semibold text-white">Super Admin</span>
          </div>
          <UserButton />
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 border-r bg-background pt-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <ul className="space-y-4 p-4">
          {navItems.map((item) => {
            // 🔥 Verificar si el link actual coincide con la ruta activa
            const isActive = pathname === item.link;
            return (
              <li key={item.id}>
                <Link
                  href={item.link}
                  className={`flex items-center space-x-2 rounded-lg p-2 transition-all duration-300 
                    ${
                      isActive
                        ? 'bg-primary text-[#01142B]' // 🔥 Color de fondo activo con texto oscuro
                        : 'text-gray-600 hover:bg-secondary hover:text-white' // 🔥 Color normal con hover
                    }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Contenido Principal */}
      <main className="p-4 pt-20 md:ml-64">{children}</main>
    </div>
  );
};

export default ResponsiveSidebar;
