"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Icons } from "~/components/ui/icons";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/estudiantes", label: "Cursos" },
    { href: "/proyectos", label: "Proyectos" },
    { href: "/comunidad", label: "Espacios" },
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
            <div className="flex-shrink-0 mt-[-13px]"> 
              <div className="relative h-[150px] w-[150px]"> 
                <Image
                  src="/artiefy-logo.svg"
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
                  <Button
                    className="cta rounded-none relative p-5 font-light text-xl italic text-primary active:scale-95 transform skew-x-[-15deg] hover:text-white"
                    style={{
                      transition: "0.5s",
                      width: "175px", 
                    }}
                    onClick={handleSignInClick}
                  >
                    <span className="inline-block transform skew-x-[15deg] relative overflow-hidden">
                      {isLoading ? (
                        <Icons.spinner className="size-5 animate-spin" />
                      ) : (
                        <>
                          Iniciar Sesión
                          <span className="absolute top-0 left-0 w-0 h-full opacity-0 bg-white shadow-[0_0_50px_30px_white] transform skew-x-[-20deg] transition-all duration-500 button-hover-effect"></span>
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
          </div>

          {/* Mobile view */}
          <div className="flex w-full items-center justify-between md:hidden">
            <div className="flex-shrink-0 mt-[-8px]"> 
              <div className="relative h-[150px] w-[150px]"> 
                <Image
                  src="/artiefy-logo.png"
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
            <div className="relative h-[150px] w-[150px] mt-[-10px]"> {/* Adjusted margin-top to move the logo up slightly */}
              <Image
                src="/artiefy-logo2.svg"
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

          <nav className="-mt-6">
            <ul className="space-y-8">
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
                <Button
                  className="border border-background cta rounded-none relative p-5 text-xl text-background bg-primary font-light italic active:scale-95 transform skew-x-[-15deg] hover:bg-background hover:text-primary hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] transition-all duration-200 button-hover"
                  style={{
                    transition: "0.5s",
                    width: "175px", 
                  }}
                  onClick={handleSignInClick}
                >
                  <span className="skew-x-[15deg]">
                    {isLoading ? (
                      <Icons.spinner className="size-5 animate-spin" />
                    ) : (
                      <>
                        Iniciar Sesión
                        <span className="absolute top-0 left-0 w-0 h-full opacity-0 bg-white shadow-[0_0_50px_30px_white] transform skew-x-[-20deg] transition-all duration-500 button-hover-effect"></span>
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