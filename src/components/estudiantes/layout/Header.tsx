'use client';

import { Suspense, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon as XMarkIconSolid } from '@heroicons/react/24/solid';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

import { UserButtonWrapper } from '../auth/UserButtonWrapper';

import { NotificationHeader } from './NotificationHeader';

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
  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  const { isLoaded: isAuthLoaded } = useAuth();

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignInClick = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!searchQuery.trim() || searchInProgress) return;

    setSearchInProgress(true);

    // Emit global search event
    const searchEvent = new CustomEvent('artiefy-search', {
      detail: { query: searchQuery.trim() },
    });
    window.dispatchEvent(searchEvent);

    // Clear the search input
    setSearchQuery('');
    setSearchInProgress(false);
  };

  const renderAuthButton = () => {
    if (!mounted) {
      return (
        <div className="flex w-[180px] items-center justify-start">
          <Icons.spinner className="text-primary h-5 w-5" />
        </div>
      );
    }

    return (
      <div className="flex min-w-[180px] items-center justify-end">
        {!isAuthLoaded ? (
          <div className="flex min-w-[180px] items-center justify-start">
            <Icons.spinner className="text-primary h-5 w-5" />
          </div>
        ) : (
          <>
            <SignedOut>
              <SignInButton>
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
                      <Icons.spinner className="size-6" />
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </span>
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2">
                <Suspense
                  fallback={
                    <div className="flex min-w-[180px] items-center justify-start">
                      <Icons.spinner className="text-primary ml-2 h-5 w-5" />
                    </div>
                  }
                >
                  <UserButtonWrapper />
                </Suspense>
                <div className="relative">
                  <NotificationHeader /> {/* Remove count prop */}
                </div>
              </div>
            </SignedIn>
          </>
        )}
      </div>
    );
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-opacity-80 bg-[#01142B] py-1 shadow-md backdrop-blur-sm'
          : 'py-4'
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="hidden w-full items-center md:flex md:justify-between">
          {!isScrolled ? (
            <div className="flex w-full items-center justify-between">
              <div className="mt-[-13px] shrink-0">
                <Link href="/estudiantes">
                  <div className="relative size-[150px]">
                    <Image
                      src="/artiefy-logo.svg"
                      alt="Logo Artiefy"
                      fill
                      unoptimized // Solo necesitamos unoptimized para SVGs
                      className="object-contain"
                      sizes="150px"
                    />
                  </div>
                </Link>
              </div>
              <div className="flex gap-24">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-lg font-light tracking-wide whitespace-nowrap text-white transition-colors hover:text-orange-500 active:scale-95"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="flex justify-end">{renderAuthButton()}</div>
            </div>
          ) : (
            <div className="flex w-full items-center">
              <div className="mt-[-13px] shrink-0">
                <Link href="/estudiantes">
                  <div className="relative size-[150px]">
                    <Image
                      src="/artiefy-logo.svg"
                      alt="Logo Artiefy"
                      fill
                      unoptimized // Solo necesitamos unoptimized para SVGs
                      className="object-contain"
                      sizes="150px"
                    />
                  </div>
                </Link>
              </div>
              <div className="flex flex-1 justify-center gap-6">
                <form onSubmit={handleSearch} className="w-[700px]">
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
              </div>
              <div className="flex items-center gap-4">
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
                  <div
                    className={`menu-options ${isDropdownOpen ? 'show' : ''}`}
                  >
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="menu-option hover:text-orange-500"
                        onClick={toggleDropdown}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">{renderAuthButton()}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex w-full items-center justify-between md:hidden">
          <div className="mt-[-8px] shrink-0">
            <Link href="/estudiantes">
              <div className="relative size-[110px]">
                {/* Reduce logo size */}
                <Image
                  src="/artiefy-logo.png"
                  alt="Logo Artiefy"
                  fill
                  priority
                  className="ml-2 object-contain" // Reduce left margin
                  sizes="(max-width: 768px) 110px, 110px"
                />
              </div>
            </Link>
          </div>
          <label className="hamburger flex h-8 w-8 items-center justify-center">
            {/* Reduce hamburger size */}
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
      <Dialog
        as="div"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        className="fixed inset-0 z-50 md:hidden"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-[75%] max-w-xs bg-white p-4 shadow-xl">
          <div className="mt-4 flex items-center justify-between">
            <div className="relative size-[110px]">
              <Link href="/estudiantes">
                <div className="relative size-[110px]">
                  <Image
                    src="/artiefy-logo2.svg"
                    alt="Logo Artiefy Mobile"
                    fill
                    unoptimized
                    className="object-contain"
                    sizes="110px"
                  />
                </div>
              </Link>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="ml-2 rounded-full text-gray-600 transition-all duration-200 hover:bg-gray-100 focus:outline-none active:bg-gray-200"
              aria-label="Close menu"
            >
              <XMarkIconSolid className="size-7" />
            </button>
          </div>
          <nav className="pb-4">
            <ul className="space-y-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-1 text-base text-gray-900 transition-colors hover:text-orange-500 active:scale-95" // Reduce font size and add less vertical padding
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 flex items-center justify-center">
            {/* Reduce top margin */}
            <Suspense
              fallback={
                <div className="flex min-w-[180px] items-center justify-start">
                  <Icons.spinner className="text-background h-5 w-5" />
                </div>
              }
            >
              {renderAuthButton()}
            </Suspense>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
