'use client';

import { useEffect,useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserButton } from '@clerk/clerk-react';
import {
	FiArchive,
	FiBook,
	FiChevronDown,
	FiChevronRight,
	FiHome,
	FiMenu,
	FiSettings,
	FiX,
} from 'react-icons/fi';

interface ResponsiveSidebarProps {
	children: React.ReactNode;
}

const ResponsiveSidebar = ({ children }: ResponsiveSidebarProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(false);
	const [isCoursesOpen, setIsCoursesOpen] = useState(false); // Estado para manejar el submenú de Cursos
	const [isProgramsOpen, setIsProgramsOpen] = useState(false); // Estado para manejar el submenú de Cursos
	const pathname = usePathname();

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
		if (isMobile) {
			console.log('Modo móvil activado');
		}
	}, [isMobile]);

	// Definir los elementos del menú sin Cursos
	const navItems = [
		{
			icon: <FiHome size={24} />,
			title: 'Usuarios y Roles',
			id: 'users',
			link: '/dashboard/super-admin',
		},
		{
			icon: <FiSettings size={24} />,
			title: 'Configuraciones',
			id: 'settings',
			link: '/dashboard/super-admin/settings',
		},
		{
			icon: <FiArchive size={24} />,
			title: 'Roles',
			id: 'roles',
			link: '/dashboard/super-admin/roles',
		},
	];

	return (
		<div className="bg-background min-h-screen">
			{/* 🔥 Overlay con desenfoque y transparencia para que el fondo siga visible 
            {isInactivePopupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg transition-all duration-300">
                    <div className="w-96 rounded-lg bg-white p-6 text-center shadow-lg">
                        <h2 className="text-xl font-bold text-cyan-500">¿Sigues ahí?</h2>
                        <p className="mt-2 text-gray-600">
                            Has estado inactivo por un tiempo. ¿Quieres continuar?
                        </p>
                        <button
                            onClick={handleContinue}
                            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )} */}

			{/* Barra superior */}
			<nav className="bg-background fixed top-0 z-40 w-full border-b border-gray-200 shadow-sm">
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
						<span className="ml-2 text-xl font-semibold text-white">
							Super Admin
						</span>
					</div>
					<UserButton />
				</div>
			</nav>

			{/* Sidebar */}
			<aside
				className={`bg-background fixed top-0 left-0 h-screen w-64 border-r pt-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} z-30 md:translate-x-0`}
			>
				<ul className="space-y-4 p-4">
					{/* Dashboard primero */}
					<li>
						<Link
							href="/dashboard/super-admin/admin2"
							className={`flex items-center space-x-2 rounded-lg p-2 transition-all duration-300 ${
								pathname === '/dashboard/super-admin/admin2'
									? 'bg-primary text-[#01142B]'
									: 'hover:bg-secondary text-gray-600 hover:text-white'
							}`}
						>
							<FiHome size={24} />
							<span>Dashboard</span>
						</Link>
					</li>

					{/* Cursos con submenú después de Dashboard */}
					<li>
						<button
							onClick={() => setIsCoursesOpen(!isCoursesOpen)}
							className="hover:bg-secondary flex w-full items-center justify-between rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white"
						>
							<div className="flex items-center space-x-2">
								<FiBook size={24} />
								<span>Cursos</span>
							</div>
							{isCoursesOpen ? (
								<FiChevronDown size={20} />
							) : (
								<FiChevronRight size={20} />
							)}
						</button>

						{/* Submenú de Cursos */}
						{isCoursesOpen && (
							<ul className="mt-2 ml-6 space-y-2">
								<li>
									<Link
										href="/dashboard/super-admin/cursos"
										className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${pathname === '/dashboard/super-admin/cursos' ? 'bg-primary text-[#01142B]' : ''}`}
									>
										Todos los Cursos
									</Link>
								</li>
								<li>
									<Link
										href="/dashboard/super-admin/categories"
										className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${pathname === '/dashboard/super-admin/categories' ? 'bg-primary text-[#01142B]' : ''}`}
									>
										Categorías
									</Link>
								</li>
								<li>
									<Link
										href="/dashboard/super-admin/modalities"
										className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${pathname === '/dashboard/super-admin/modalities' ? 'bg-primary text-[#01142B]' : ''}`}
									>
										Modalidades
									</Link>
								</li>
								<li>
									<Link
										href="/dashboard/super-admin/difficulties"
										className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${pathname === '/dashboard/super-admin/difficulties' ? 'bg-primary text-[#01142B]' : ''}`}
									>
										Niveles
									</Link>
								</li>
							</ul>
						)}
					</li>
					<li>
						<button
							onClick={() => setIsProgramsOpen(!isProgramsOpen)}
							className="hover:bg-secondary flex w-full items-center justify-between rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white"
						>
							<div className="flex items-center space-x-2">
								<FiBook size={24} />
								<span>Programas</span>
							</div>
							{isProgramsOpen ? (
								<FiChevronDown size={20} />
							) : (
								<FiChevronRight size={20} />
							)}
						</button>

						{/* Submenú de Programas */}
						{isProgramsOpen && (
							<ul className="mt-2 ml-6 space-y-2">
								<li>
									<Link
										href="/dashboard/super-admin/programs"
										className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${pathname === '/dashboard/super-admin/programs' ? 'bg-primary text-[#01142B]' : ''}`}
									>
										Todos los programas
									</Link>
								</li>
								<li>
									<Link
										href="/dashboard/super-admin/modalities"
										className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${pathname === '/dashboard/super-admin/modalities' ? 'bg-primary text-[#01142B]' : ''}`}
									>
										Materias
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
									className={`flex items-center space-x-2 rounded-lg p-2 transition-all duration-300 ${isActive ? 'bg-primary text-[#01142B]' : 'hover:bg-secondary text-gray-600 hover:text-white'}`}
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
