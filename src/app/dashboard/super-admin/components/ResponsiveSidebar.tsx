'use client';

import { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiBook,
  FiSettings,
  FiArchive,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import usePageTimeTracker from '~/hooks/usePageTimeTracker';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

const ResponsiveSidebar = ({ children }: ResponsiveSidebarProps) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false); // Estado para manejar el submenú de Cursos
  const pathname = usePathname();

  // ✅ Usar el tracker de tiempo con el popup de inactividad
  const { isInactivePopupOpen, handleContinue } = usePageTimeTracker(user?.id ?? null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsOpen(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?.id) {
      console.log("Usando el hook para rastrear tiempo para el usuario:", user.id);
    }
  }, [user]);

  // Definir los elementos del menú sin Cursos
  const navItems = [
    { icon: <FiHome size={24} />, title: 'Usuarios y Roles', id: 'users', link: '/dashboard/super-admin' },
    { icon: <FiSettings size={24} />, title: 'Configuraciones', id: 'settings', link: '/dashboard/super-admin/settings' },
    { icon: <FiArchive size={24} />, title: 'Roles', id: 'roles', link: '/dashboard/super-admin/roles' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 🔥 Overlay con desenfoque y transparencia para que el fondo siga visible */}
      {isInactivePopupOpen && (
  <div className="fixed inset-0  backdrop-blur-lg flex items-center justify-center z-50 transition-all duration-300">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
      <h2 className="text-xl font-bold text-cyan-500">¿Sigues ahí?</h2>
      <p className="mt-2 text-gray-600">Has estado inactivo por un tiempo. ¿Quieres continuar?</p>
      <button
        onClick={handleContinue}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Continuar
      </button>
    </div>
  </div>
)}


      {/* Barra superior */}
      <nav className="fixed top-0 z-40 w-full border-b border-gray-200 bg-background shadow-sm">
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
      <aside className={`fixed left-0 top-0 h-screen w-64 border-r bg-background pt-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 z-30`}>
        <ul className="space-y-4 p-4">

          {/* Dashboard primero */}
          <li>
            <Link
              href="/dashboard/"
              className={`flex items-center space-x-2 rounded-lg p-2 transition-all duration-300 
                ${pathname === "/dashboard/" ? "bg-primary text-[#01142B]" : "text-gray-600 hover:bg-secondary hover:text-white"}`}
            >
              <FiHome size={24} />
              <span>Dashboard</span>
            </Link>
          </li>

          {/* Cursos con submenú después de Dashboard */}
          <li>
            <button
              onClick={() => setIsCoursesOpen(!isCoursesOpen)}
              className="flex w-full items-center justify-between rounded-lg p-2 text-gray-600 hover:bg-secondary hover:text-white transition-all duration-300"
            >
              <div className="flex items-center space-x-2">
                <FiBook size={24} />
                <span>Cursos</span>
              </div>
              {isCoursesOpen ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
            </button>

            {/* Submenú de Cursos */}
            {isCoursesOpen && (
              <ul className="ml-6 mt-2 space-y-2">
                <li>
                  <Link
                    href="/dashboard/super-admin/cursos"
                    className={`block rounded-lg p-2 text-gray-600 hover:bg-secondary hover:text-white transition-all duration-300 
                      ${pathname === "/dashboard/super-admin/cursos" ? "bg-primary text-[#01142B]" : ""}`}
                  >
                    📚 Todos los Cursos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/super-admin/categorias"
                    className={`block rounded-lg p-2 text-gray-600 hover:bg-secondary hover:text-white transition-all duration-300 
                      ${pathname === "/dashboard/super-admin/categorias" ? "bg-primary text-[#01142B]" : ""}`}
                  >
                    📂 Categorías
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/super-admin/modalidades"
                    className={`block rounded-lg p-2 text-gray-600 hover:bg-secondary hover:text-white transition-all duration-300 
                      ${pathname === "/dashboard/super-admin/modalidades" ? "bg-primary text-[#01142B]" : ""}`}
                  >
                    🎓 Modalidades
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/super-admin/dificultades"
                    className={`block rounded-lg p-2 text-gray-600 hover:bg-secondary hover:text-white transition-all duration-300 
                      ${pathname === "/dashboard/super-admin/dificultades" ? "bg-primary text-[#01142B]" : ""}`}
                  >
                    🚀 Dificultades
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Otros elementos del menú */}
          {navItems.map((item) => {
            const isActive = pathname === item.link;
            return (
              <li key={item.id}>
                <Link
                  href={item.link}
                  className={`flex items-center space-x-2 rounded-lg p-2 transition-all duration-300 
                    ${isActive ? 'bg-primary text-[#01142B]' : 'text-gray-600 hover:bg-secondary hover:text-white'}`}
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
