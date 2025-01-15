import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Info } from 'lucide-react';
import Image from 'next/image';
import {
  FiHome,
  FiBook,
  FiFileText,
  FiUser,
  FiSettings,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { cn } from '~/lib/utils'; // Asegúrate de tener la función 'cn' para clases condicionales.
import { ModalError } from './educators/modals/modalError';
import { Button } from './educators/ui/button';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

const ResponsiveSidebar = ({ children }: ResponsiveSidebarProps) => {
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

  const navItems = [
    { icon: <FiHome size={24} />, title: 'Home', id: 'home' },
    { icon: <FiBook size={24} />, title: 'Courses', id: 'courses' },
    { icon: <FiFileText size={24} />, title: 'Resources', id: 'resources' },
    { icon: <FiUser size={24} />, title: 'Profile', id: 'profile' },
    { icon: <FiSettings size={24} />, title: 'Settings', id: 'settings' },
  ];

  const [activeItem, setActiveItem] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="border-none p-2 text-yellow-300 hover:cursor-pointer"
                title="Información"
              >
                <Info />
              </Button>
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
          'fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white pt-20 transition-transform dark:border-gray-700 dark:bg-gray-800 sm:translate-x-0',
          !isOpen && '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div className="h-full overflow-y-auto bg-white px-3 pb-4">
          <ul className="space-y-2 font-medium">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  className={cn(
                    'group flex w-full items-center rounded-lg p-2 text-gray-900 hover:bg-gray-100',
                    activeItem === item.id ? 'bg-blue-50 text-blue-600' : ''
                  )}
                >
                  <span className="text-gray-500 transition duration-75 group-hover:text-gray-900">
                    {item.icon}
                  </span>
                  <span
                    className={cn('ml-3', !isOpen && isMobile ? 'hidden' : '')}
                  >
                    {item.title}
                  </span>
                </button>
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
