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

  return (
    <header>
      <div className="container mx-auto max-w-5xl p-6">
        {/* Contenedor principal con distribución equitativa de los elementos en pantallas grandes */}
        <div className="flex items-center justify-between space-x-16 lg:space-x-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              src="/logo-artiefy.webp"
              alt="Logo Artiefy"
              width={100}
              height={100}
            />
          </div>

          {/* Menú de navegación en pantallas grandes */}
          <nav className="hidden flex-grow md:flex">
            <ul className="flex w-full justify-between gap-x-8">
              {" "}
              {/* Espaciado igual entre los elementos */}
              <li>
                <Link
                  href="/"
                  className="text-shadow px-2 py-1 hover:text-orange-500"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/cursos"
                  className="text-shadow px-2 py-1 hover:text-orange-500"
                >
                  Cursos
                </Link>
              </li>
              <li>
                <Link
                  href="/proyectos"
                  className="text-shadow px-2 py-1 hover:text-orange-500"
                >
                  Proyectos
                </Link>
              </li>
              <li>
                <Link
                  href="/comunidad"
                  className="text-shadow px-2 py-1 hover:text-orange-500"
                >
                  Comunidad
                </Link>
              </li>
            </ul>
          </nav>

          {/* Botón de inicio de sesión o usuario */}
          <div className="hidden md:block">
            <SignedOut>
              <SignInButton>
                <Button className="text-xl font-extralight">
                  Iniciar Sesión
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton showName />
            </SignedIn>
          </div>

          {/* Botón para abrir el menú en pantallas pequeñas */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center p-2"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable para móviles */}
      <Dialog
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-10 opacity-30" />
        <DialogPanel className="fixed inset-y-0 right-0 z-20 w-3/4 max-w-xs bg-white p-6">
          <div className="flex items-center justify-between">
            <Image
              src="/logo-artiefy.webp"
              alt="Logo Artiefy"
              width={150}
              height={150}
            />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center p-2 text-background"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="mt-6">
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  className="text-background hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/cursos"
                  className="text-background hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cursos
                </Link>
              </li>
              <li>
                <Link
                  href="/proyectos"
                  className="text-background hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Proyectos
                </Link>
              </li>
              <li>
                <Link
                  href="/comunidad"
                  className="text-background hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Comunidad
                </Link>
              </li>
            </ul>
          </nav>

          {/* Botón de inicio de sesión en móviles con estilo personalizado */}
          <div className="mt-6">
            <SignedOut>
              <SignInButton>
                <Button className="w-full rounded-md bg-primary py-2 text-black transition duration-300 hover:bg-background">
                  Iniciar Sesión
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
