'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
	SignInButton,
	SignedIn,
	SignedOut,
	UserButton,
	ClerkLoaded,
	ClerkLoading,
} from '@clerk/nextjs';
import { Dialog, DialogPanel } from '@headlessui/react';
import {
	UserCircleIcon,
	XMarkIcon as XMarkIconSolid,
} from '@heroicons/react/24/solid';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import '~/styles/barsicon.css';
import '~/styles/searchBar.css';
import '~/styles/headerSearchBar.css';
import '~/styles/headerMenu.css';

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const navItems = [
		{ href: '/', label: 'Inicio' },
		{ href: '/estudiantes', label: 'Cursos' },
		{ href: '/proyectos', label: 'Proyectos' },
		{ href: '/comunidad', label: 'Espacios' },
		{ href: '/planes', label: 'Planes' },
	];

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.header-menu')) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSignInClick = () => {
		setIsLoading(true);
		// Simulate loading
		setTimeout(() => setIsLoading(false), 2000);
	};

	const handleSearch = (e?: React.FormEvent) => {
		e?.preventDefault();
		// Add your search logic here
		if (searchQuery.trim()) {
			// Implement search functionality
			console.log('Searching:', searchQuery);
			// Reset search query after search
			setSearchQuery('');
		}
	};

	return (
		<header
			className={`sticky top-0 z-50 w-full transition-all duration-300 ${
				isScrolled
					? 'bg-opacity-80 bg-[#01142B] py-1 shadow-md backdrop-blur-sm'
					: 'bg-transparent py-4'
			}`}
		>
			<div className="container mx-auto max-w-7xl px-4">
				<div className="hidden w-full items-center md:flex md:justify-between">
					{/* Logo */}
					<div
						className={`transition-all duration-300 ${isScrolled ? 'mt-0' : 'mt-[-13px]'}`}
					>
						<Link href="/estudiantes">
							<div className="relative size-[150px]">
								<Image
									src="/artiefy-logo.svg"
									alt="Logo Artiefy"
									fill
									priority
									className="object-contain"
									sizes="(max-width: 768px) 150px, 150px"
								/>
							</div>
						</Link>
					</div>

					{/* Navigation items with increased spacing */}
					{!isScrolled ? (
						<nav className="flex items-center justify-center pl-12">
							{' '}
							{/* Added pl-12 for right padding */}
							<div className="flex gap-24">
								{navItems.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										className="text-shadow text-lg font-light tracking-wide whitespace-nowrap transition-colors hover:text-orange-500 active:scale-95"
									>
										{item.label}
									</Link>
								))}
							</div>
						</nav>
					) : (
						// Search bar and hamburger when scrolled
						<div className="flex items-center gap-6">
							<form onSubmit={handleSearch} className="w-[400px]">
								<div className="header-search-container">
									<input
										type="search"
										placeholder="Buscar..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="header-input border-primary"
									/>
									<svg
										viewBox="0 0 24 24"
										className="header-search__icon"
										onClick={handleSearch}
									>
										<path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
									</svg>
								</div>
							</form>
							<div className="header-menu">
								<button
									className="menu-selected"
									onClick={toggleDropdown}
									type="button"
								>
									Menú
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 512 512"
										className={`menu-arrow ${isDropdownOpen ? 'rotate' : ''}`}
									>
										<path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
									</svg>
								</button>
								<div className={`menu-options ${isDropdownOpen ? 'show' : ''}`}>
									{navItems.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											className="menu-option"
											onClick={toggleDropdown}
										>
											{item.label}
										</Link>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Auth Button */}
					<div className="flex w-[160px] justify-end">
						<SignedOut>
							<SignInButton fallbackRedirectUrl="/estudiantes">
								<Button
									className="border-primary bg-primary text-background hover:bg-background hover:text-primary relative skew-x-[-15deg] cursor-pointer rounded-none border p-5 text-xl font-light italic transition-all duration-200 hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] active:scale-95"
									style={{
										transition: '0.5s',
										width: '180px',
									}}
									onClick={handleSignInClick}
								>
									<span className="relative skew-x-[15deg] overflow-hidden font-semibold">
										{isLoading ? (
											<Icons.spinner
												className="animate-spin"
												style={{ width: '25px', height: '25px' }}
											/>
										) : (
											<>Iniciar Sesión</>
										)}
									</span>
								</Button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<ClerkLoading>
								<div className="flex h-10 items-center justify-center">
									<Icons.spinner className="size-6 animate-spin" />
								</div>
							</ClerkLoading>
							<ClerkLoaded>
								<UserButton showName>
									<UserButton.MenuItems>
										<UserButton.Link
											label="Mis Cursos"
											labelIcon={<UserCircleIcon className="size-4" />}
											href="/estudiantes/myaccount"
										/>
										<UserButton.Action label="manageAccount" />
									</UserButton.MenuItems>
								</UserButton>
							</ClerkLoaded>
						</SignedIn>
					</div>
				</div>

				{/* Mobile view */}
				<div className="flex w-full items-center justify-between md:hidden">
					<div className="mt-[-8px] shrink-0">
						<Link href="/estudiantes">
							<div className="relative size-[150px]">
								<Image
									src="/artiefy-logo.png"
									alt="Logo Artiefy"
									fill
									priority
									className="ml-6 object-contain"
									sizes="(max-width: 768px) 150px, 150px"
								/>
							</div>
						</Link>
					</div>
					<label className="hamburger flex h-12 w-12 items-center justify-center">
						<input
							type="checkbox"
							checked={mobileMenuOpen}
							onChange={(e) => setMobileMenuOpen(e.target.checked)}
						/>
						<svg viewBox="0 0 32 32">
							<path
								className="line line-top-bottom"
								d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
							/>
							<path className="line" d="M7 16 27 16" />
						</svg>
					</label>
				</div>
			</div>

			{/* Mobile Menu */}
			<Dialog
				as="div"
				open={mobileMenuOpen}
				onClose={() => setMobileMenuOpen(false)}
				className="fixed inset-0 z-50 md:hidden"
			>
				<div className="fixed inset-0 bg-black/30" aria-hidden="true" />
				<DialogPanel className="fixed inset-y-0 right-0 z-50 w-[65%] max-w-sm bg-white p-6 shadow-xl">
					<div className="mt-9 flex items-center justify-between">
						<div className="relative size-[150px]">
							<Link href="/estudiantes">
								<div className="relative size-[150px]">
									<Image
										src="/artiefy-logo2.svg"
										alt="Logo Artiefy Mobile"
										fill
										priority
										className="object-contain"
										sizes="150px"
									/>
								</div>
							</Link>
						</div>
						<button
							onClick={() => setMobileMenuOpen(false)}
							className="ml-5 rounded-full text-gray-600 transition-all duration-200 hover:bg-gray-100 focus:outline-none active:bg-gray-200"
							aria-label="Close menu"
						>
							<XMarkIconSolid className="size-8" />
						</button>
					</div>

					<nav className="pb-7">
						<ul className="space-y-12">
							{navItems.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="block text-lg text-gray-900 transition-colors hover:text-orange-500 active:scale-95"
										onClick={() => setMobileMenuOpen(false)}
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					{/* Mobile Menu - Fix closing tags */}
					<div className="mt-6 flex items-center justify-center">
						<SignedOut>
							<SignInButton fallbackRedirectUrl="/estudiantes">
								<Button
									className="border-primary bg-primary text-background focus:bg-background focus:text-primary relative skew-x-[-15deg] cursor-pointer rounded-none border p-5 text-xl font-light italic transition-all duration-200 focus:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] active:scale-95"
									style={{
										transition: '0.5s',
										width: '180px',
									}}
									onClick={handleSignInClick}
								>
									<span className="relative skew-x-[15deg] overflow-hidden font-semibold">
										{isLoading ? (
											<Icons.spinner
												className="animate-spin"
												style={{ width: '25px', height: '25px' }}
											/>
										) : (
											<>Iniciar Sesión</>
										)}
									</span>
								</Button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<div className="cl-userButton-root mr-6 flex w-full justify-center">
								<ClerkLoading>
									<div className="flex h-10 items-center justify-center">
										<Icons.spinner className="size-6 animate-spin" />
									</div>
								</ClerkLoading>
								<ClerkLoaded>
									<UserButton showName>
										<UserButton.MenuItems>
											<UserButton.Link
												label="Mis Cursos"
												labelIcon={<UserCircleIcon className="size-4" />}
												href="/estudiantes/myaccount"
											/>
											<UserButton.Action label="manageAccount" />
										</UserButton.MenuItems>
									</UserButton>
								</ClerkLoaded>
							</div>
						</SignedIn>
					</div>
				</DialogPanel>
			</Dialog>
		</header>
	);
}
