"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/estudiantes", label: "Cursos" },
    { href: "/proyectos", label: "Proyectos" },
    { href: "/comunidad", label: "Comunidad" },
  ];

  return (
    <header className="py-4">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          {/* All header items are now in a single flex container */}
          <div className="hidden w-full items-center justify-between md:flex">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="relative h-[100px] w-[100px]">
                <Image
                  src="/logo-artiefy.webp"
                  alt="Logo Artiefy"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                  quality={100}
                />
              </div>
            </div>

            {/* Navigation items */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-shadow transform transition-colors hover:text-orange-500 active:scale-95"
              >
                {item.label}
              </Link>
            ))}

            {/* Auth Button */}
            <div>
              <SignedOut>
                <SignInButton>
                  <Button className="transform text-lg font-light transition-transform active:scale-95">
                    Iniciar Sesión
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
              <UserButton showName/>
              </SignedIn>
            </div>
          </div>

          {/* Mobile view */}
          <div className="flex w-full items-center justify-between md:hidden">
            <div className="flex-shrink-0">
              <div className="relative h-[100px] w-[100px]">
                <Image
                  src="/logo-artiefy.webp"
                  alt="Logo Artiefy"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                  quality={100}
                />
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex transform items-center justify-center p-2 transition-transform active:scale-95"
              aria-label="Open main menu"
            >
              <Bars3Icon className="h-6 w-6" />
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
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-[75%] max-w-sm bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="relative h-[100px] w-[100px]">
              <Image
                src="/logo-artiefy.webp"
                alt="Logo Artiefy"
                fill
                style={{ objectFit: "contain" }}
                priority
                quality={100}
              />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="transform rounded-full p-1 text-gray-400 transition-transform hover:bg-gray-100 active:scale-95"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="mt-6">
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block transform text-lg text-gray-900 transition-colors hover:text-orange-500 active:scale-95"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6">
            <SignedOut>
              <SignInButton>
                <Button className="w-full transform justify-center border-background bg-[#00BDD8] text-lg font-semibold text-white transition-colors hover:bg-background active:scale-95">
                  Iniciar Sesión
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn >
              <UserButton showName />
            </SignedIn>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
