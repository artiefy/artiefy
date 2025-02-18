'use client';

import { useState } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const navItems = [
		{ href: '/', label: 'Inicio' },
		{ href: '/estudiantes', label: 'Cursos' },
		{ href: '/proyectos', label: 'Proyectos' },
		{ href: '/comunidad', label: 'Espacios' },
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
						<div>
							<SignedOut>
								<SignInButton>
									<Button
										className="relative skew-x-[-15deg] cursor-pointer rounded-none border border-primary bg-primary p-5 text-xl font-light text-background italic transition-all duration-200 hover:bg-background hover:text-primary hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] active:scale-95"
										style={{
											transition: '0.5s',
											width: '175px',
										}}
										onClick={handleSignInClick}
									>
										<span className="relative skew-x-[15deg] overflow-hidden">
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
								<UserButton showName />
							</SignedIn>
						</div>
					</div>

					{/* Mobile view */}
					<div className="flex w-full items-center justify-between md:hidden">
						<div className="mt-[-8px] shrink-0">
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
						</div>
						<button
							onClick={() => setMobileMenuOpen(true)}
							className="inline-flex items-center justify-center p-2 transition-transform active:scale-95"
							aria-label="Open main menu"
						>
							<Bars3Icon className="mr-4 size-8" />
						</button>
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
					<div className="flex items-center justify-between">
						<div className="relative mt-[-10px] size-[150px]">
							{' '}
							{/* Icon SVG */}
							<Image
								src="/artiefy-logo2.svg"
								alt="Logo Artiefy"
								fill
								className="object-contain"
								sizes="150px"
							/>
						</div>
						<button
							onClick={() => setMobileMenuOpen(false)}
							className="ml-5 rounded-full p-1 text-gray-400 transition-transform hover:bg-gray-100 active:scale-95"
							aria-label="Close menu"
						>
							<XMarkIcon className="size-6" />
						</button>
					</div>

					<nav className="-mt-6">
						<ul className="space-y-8">
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
							<SignInButton>
								<Button
									className="button-hover relative skew-x-[-15deg] cursor-pointer rounded-none border border-background bg-primary p-5 text-xl font-light text-background italic transition-all duration-200 hover:bg-background hover:text-primary hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] active:scale-95"
									style={{
										transition: '0.5s',
										width: '175px',
									}}
									onClick={handleSignInClick}
								>
									<span className="skew-x-[15deg]">
										{isLoading ? (
											<Icons.spinner
												style={{ width: '25px', height: '25px' }}
											/>
										) : (
											<>
												Iniciar Sesión
												<span className="button-hover-effect absolute top-0 left-0 h-full w-0 skew-x-[-20deg] bg-white opacity-0 shadow-[0_0_50px_30px_white] transition-all duration-500"></span>
											</>
										)}
									</span>
								</Button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<UserButton showName />
						</SignedIn>
					</div>
				</DialogPanel>
			</Dialog>
		</header>
	);
}

