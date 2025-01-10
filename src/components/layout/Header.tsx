"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Dialog, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 150px"
                  onLoad={(e) =>
                    console.log(
                      `Image loaded with width: ${(e.target as HTMLImageElement).naturalWidth}`,
                    )
                  }
                  onError={(e) =>
                    console.error(
                      `Failed to load image: ${(e.target as HTMLImageElement).src}`,
                    )
                  }
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
                    className="cta relative skew-x-[-20deg] transform rounded-none border-2 border-primary bg-transparent p-5 text-xl font-light italic text-primary hover:bg-white/30 hover:text-primary active:scale-95"
                    style={{
                      transition: "0.5s",
                      width: "190px",
                    }}
                    onClick={handleSignInClick}
                  >
                    <div className="flex w-full items-center justify-center">
                      {isLoading ? (
                        <Icons.spinner
                          className="animate-spin"
                          style={{ height: "20px", width: "20px" }}
                        />
                      ) : (
                        <>
                          <span className="inline-block skew-x-[15deg] transform">
                            Iniciar Sesión
                          </span>
                        </>
                      )}
                    </div>
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton showName />
              </SignedIn>
            </div>
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
              {/* Adjusted margin-top to move the logo up slightly */}
              <Image
                src="/artiefy-logo2.svg"
                alt="Logo Artiefy"
                fill
                style={{ objectFit: "contain" }}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 150px"
                onLoad={(e) =>
                  console.log(
                    `Image loaded with width: ${(e.target as HTMLImageElement).naturalWidth}`,
                  )
                }
                onError={(e) =>
                  console.error(
                    `Failed to load image: ${(e.target as HTMLImageElement).src}`,
                  )
                }
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
            <ul className="space-y-12">
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

          <div className="mt-12">
            <SignedOut>
              <SignInButton>
                <Button
                  className="cta relative skew-x-[-20deg] transform rounded-none border-2 border-background bg-background p-5 text-xl font-light italic text-primary transition-colors duration-500 hover:bg-primary hover:text-background active:scale-95"
                  style={{
                    width: "190px",
                  }}
                  onClick={handleSignInClick}
                >
                  <div className="flex w-full items-center justify-center">
                    {isLoading ? (
                      <Icons.spinner
                        className="animate-spin"
                        style={{ height: "20px", width: "20px" }}
                      />
                    ) : (
                      <span className="inline-block skew-x-[15deg] transform">
                        Iniciar Sesión
                      </span>
                    )}
                  </div>
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