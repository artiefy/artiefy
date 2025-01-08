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
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <header className="py-4">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <div className="hidden w-full items-center justify-between md:flex">
            {/* Logo */}
            <div className="mt-[-13px] flex-shrink-0">
              <div className="relative h-[150px] w-[150px]">
                <Image
                  src="/artiefy-logo.svg"
                  alt="Logo Artiefy"
                  fill
                  className="object-contain"
                  priority
                  loading="eager"
                  onLoad={(e) => console.log(`Image loaded with width: ${(e.target as HTMLImageElement).naturalWidth}`)}
                  onError={(e) => console.error(`Failed to load image: ${(e.target as HTMLImageElement).src}`)}
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
                    className="cta relative skew-x-[-15deg] transform rounded-none p-5 text-xl font-light italic text-primary hover:text-white active:scale-95"
                    style={{
                      transition: "0.5s",
                      width: "175px",
                    }}
                    onClick={handleSignInClick}
                  >
                    <span className="relative inline-block skew-x-[15deg] transform overflow-hidden">
                      {isLoading ? (
                        <Icons.spinner className="size-5 animate-spin" />
                      ) : (
                        <>
                          Iniciar Sesión
                          <span className="button-hover-effect absolute left-0 top-0 h-full w-0 skew-x-[-20deg] transform bg-white opacity-0 shadow-[0_0_50px_30px_white] transition-all duration-500"></span>
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
            <div className="mt-[-8px] flex-shrink-0">
              <div className="relative h-[150px] w-[150px]">
                <Image
                  src="/artiefy-logo.png"
                  alt="Logo Artiefy"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                  quality={100}
                  loading="eager"
                  onLoad={(e) => console.log(`Image loaded with width: ${(e.target as HTMLImageElement).naturalWidth}`)}
                  onError={(e) => console.error(`Failed to load image: ${(e.target as HTMLImageElement).src}`)}
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
            <div className="relative mt-[-10px] h-[150px] w-[150px]">
              {" "}
              {/* Adjusted margin-top to move the logo up slightly */}
              <Image
                src="/artiefy-logo2.svg"
                alt="Logo Artiefy"
                fill
                style={{ objectFit: "contain" }}
                priority
                loading="eager"
                onLoad={(e) => console.log(`Image loaded with width: ${(e.target as HTMLImageElement).naturalWidth}`)}
                onError={(e) => console.error(`Failed to load image: ${(e.target as HTMLImageElement).src}`)}
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
                  className="cta button-hover relative skew-x-[-15deg] transform rounded-none border border-background bg-primary p-5 text-xl font-light italic text-background transition-all duration-200 hover:bg-background hover:text-primary hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] active:scale-95"
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
                        <span className="button-hover-effect absolute left-0 top-0 h-full w-0 skew-x-[-20deg] transform bg-white opacity-0 shadow-[0_0_50px_30px_white] transition-all duration-500"></span>
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