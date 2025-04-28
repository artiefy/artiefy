'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Dialog, DialogPanel } from '@headlessui/react';
import {
	UserCircleIcon,
	XMarkIcon as XMarkIconSolid,
} from '@heroicons/react/24/solid';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import '~/styles/barsicon.css';

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const navItems = [
		{ href: '/', label: 'Inicio' },
		{ href: '/estudiantes', label: 'Cursos' },
		{ href: '/proyectos', label: 'Proyectos' },
		{ href: '/comunidad', label: 'Espacios' },
		{ href: '/planes', label: 'Planes' }, // New navigation item
	];

	const handleSignInClick = () => {
		setIsLoading(true);
		// Simulate loading
		setTimeout(() => setIsLoading(false), 2000);
	};

	return (
		<header className="py-4">
			<div className="container mx-auto max-w-7xl px-4">
				<div className="flex items-center justify-between">
					<div className="hidden w-full items-center justify-between md:flex">
						{/* Logo */}
						<div className="mt-[-13px] shrink-0">
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

						{/* Navigation items */}
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="text-shadow transition-colors hover:text-orange-500 active:scale-95"
							>
								{item.label}
							</Link>
						))}

						{/* Auth Button */}
						<div className="flex items-center justify-center">
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
								<div className="relative">
									<UserButton
										showName
										appearance={{
											elements: {
												userButtonBox: 'w-full h-full',
												userButtonTrigger: 'w-full h-full',
											},
										}}
									>
										<UserButton.MenuItems>
											<UserButton.Link
												label="Mis Cursos"
												labelIcon={<UserCircleIcon className="size-4" />}
												href="/estudiantes/myaccount"
											/>
											<UserButton.Action label="manageAccount" />
										</UserButton.MenuItems>
									</UserButton>
								</div>
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
							<div className="relative flex w-full justify-center">
								<UserButton
									showName
									appearance={{
										elements: {
											userButtonBox: 'w-full h-full',
											userButtonTrigger: 'w-full h-full',
										},
									}}
								>
									<UserButton.MenuItems>
										<UserButton.Link
											label="Mis Cursos"
											labelIcon={<UserCircleIcon className="size-4" />}
											href="/estudiantes/myaccount"
										/>
										<UserButton.Action label="manageAccount" />
									</UserButton.MenuItems>
								</UserButton>
							</div>
						</SignedIn>
					</div>
				</DialogPanel>
			</Dialog>
		</header>
	);
}
