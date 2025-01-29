'use client';

import { useState, useEffect, type JSX } from 'react';
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
  FiAlertOctagon,
  FiBookOpen,
  FiArchive,
} from 'react-icons/fi';
import { ModalError } from './admin/ui/modalerror';
import { cn } from '~/lib/utils';

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
      setIsOpen(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { icon: <FiHome size={24} />, title: 'Dashboard', id: 'home', link: '/dashboard/super-admin' },
    { icon: <FiBook size={24} />, title: 'Cursos', id: 'cursos', link: '/dashboard/super-admin/cursos' },
    { icon: <FiSettings size={24} />, title: 'Configuraciones', id: 'settings', link: '/dashboard/super-admin/settings' },
    { icon: <FiArchive size={24} />, title: 'Roles', id: 'roles', link: '/dashboard/super-admin/roles' },
];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-background shadow-sm">
        <div className="p-3 lg:px-5 lg:pl-3 flex justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100"
            aria-controls="sidebar"
            aria-expanded={isOpen}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <div className="flex items-center">
            <Image src="/favicon.ico" width={38} height={38} alt="Logo" />
            <span className="ml-2 text-xl font-semibold">Super Admin</span>
          </div>
          <UserButton />
        </div>
      </nav>

      <aside className={`fixed left-0 top-0 h-screen w-64 border-r bg-background pt-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <ul className="p-4 space-y-4">
          {navItems.map((item) => (
            <li key={item.id}>
              <Link href={item.link} className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <main className={`p-4 md:ml-64 pt-20`}>{children}</main>
    </div>
  );
};

export default ResponsiveSidebar;
