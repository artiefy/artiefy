'use client';
import { useState, useEffect, type JSX } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserButton, useUser } from '@clerk/clerk-react';
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
	FiChevronDown,
	FiChevronRight,
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
	const [isCoursesOpen, setIsCoursesOpen] = useState(false); // Estado para manejar el submenú de Cursos
	const [isProgramsOpen, setIsProgramsOpen] = useState(false); // Estado para manejar el submenú de Programas
	const pathname = usePathname();

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
			setIsOpen(window.innerWidth > 768); // Permite que la barra lateral esté abierta en desktop
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const navItemsSuperAdmin = [
		{
			icon: <FiHome size={24} />,
			title: 'Usuarios y Roles',
			id: 'users',
			link: '/dashboard/super-admin',
		},
		{
			icon: <FiMessageSquare size={24} />,
			title: 'Foro',
			id: 'foro',
			link: '/dashboard/super-admin/foro',
		},
		{
			icon: <FiMessageSquare size={24} />,
			title: 'Tickets',
			id: 'tickets',
			link: '/dashboard/super-admin/tickets',
		},
		{
			icon: <FiShieldOff size={24} />,
			title: 'Roles Secundarios',
			id: 'roles-secundarios',
			link: '/dashboard/super-admin/usuariosRoles',
		},
	];

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
			id: 'coursesd',
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
			title: 'Foros',
			id: 'forum',
			link: '/dashboard/educadores/foro',
		},
		{ icon: <FiUser size={24} />, title: 'Perfil', id: 'profile', link: '/' },
		{
			icon: <FiShieldOff size={24} />,
			title: 'Reportar errores',
			id: 'errores',
			onClick: () => setIsModalOpen(true),
		},
		{
			icon: <FiSettings size={24} />,
			title: 'Configuraciones',
			id: 'settings',
			link: '/',
		},
	];

	const navItemsAdmin = [
		{
			icon: <FiHome size={24} />,
			title: 'Home',
			id: 'home',
			link: '/dashboard/admin',
		},
		{
			icon: <FiBook size={24} />,
			title: 'Cursos',
			id: 'courses',
			link: '/dashboard/admin/cursos',
		},
		{
			icon: <FiFileText size={24} />,
			title: 'Proyectos',
			id: 'Proyectos',
			link: '/dashboard/admin2/app/proyectos',
		},
		{
			icon: <FiUser size={24} />,
			title: 'Perfil',
			id: 'profile',
			link: '/dashboard/admin2/app/perfil',
		},
		{
			icon: <FiSettings size={24} />,
			title: 'Configuraciones',
			id: 'settings',
			link: '/dashboard/admin2/app/configuracion',
		},
		{
			icon: <FiMessageSquare size={24} />,
			title: 'Foro',
			id: 'foro',
			link: '/dashboard/admin/foro',
		},
		{
			icon: <FiMessageSquare size={24} />,
			title: 'Tickets',
			id: 'tickets',
			link: '/dashboard/admin/tickets',
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
	} else if (user?.publicMetadata?.role === 'super-admin') {
		navItems = navItemsSuperAdmin;
	}
	const [activeItem, setActiveItem] = useState('home');

	return (
		<div className="bg-background min-h-screen">
			{/* Navbar */}
			<nav className="bg-background fixed top-0 z-40 w-full border-b border-gray-200 shadow-xs">
				<div className="p-3 lg:px-5 lg:pl-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<button
								onClick={() => isMobile && setIsOpen(!isOpen)}
								className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-hidden md:hidden"
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
					'bg-background fixed top-0 left-0 z-30 h-screen w-64 border-r border-gray-200 pt-20 transition-transform sm:translate-x-0 dark:border-gray-700 dark:bg-gray-800',
					!isOpen && '-translate-x-full'
				)}
				aria-label="Sidebar"
			>
				<div className="bg-background h-full overflow-y-auto px-3 pb-4">
					<ul className="space-y-5 font-medium">
						{navItems.map((item) => (
							<li key={item.id} onClick={item.onClick}>
								<Link
									href={item.link ?? '#'}
									onClick={() => setActiveItem(item.id)}
									className={cn(
										'group hover:bg-primary flex w-full items-center rounded-lg p-2 text-white',
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
						{user?.publicMetadata?.role === 'super-admin' && (
							<>
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
													href="/dashboard/super-admin/materias"
													className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${pathname === '/dashboard/super-admin/modalities' ? 'bg-primary text-[#01142B]' : ''}`}
												>
													Materias
												</Link>
											</li>
											<li>
												<Link
													href="/dashboard/super-admin/programs/enrolled_users"
													className={`hover:bg-secondary block rounded-lg p-2 text-gray-600 transition-all duration-300 hover:text-white ${
														pathname ===
														'/dashboard/super-admin/programs/enrolled_users'
															? 'bg-primary text-[#01142B]'
															: ''
													}`}
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
				className={`pt-20 transition-all duration-300 ${isOpen ? 'sm:ml-64' : ''}`}
			>
				{children}
			</div>
		</div>
	);
};

export default ResponsiveSidebar;
