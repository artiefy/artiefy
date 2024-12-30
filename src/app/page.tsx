"use client";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "~/components/layout/Header";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { Info } from "lucide-react";
import { ModalError } from "~/components/modals/modalError";


export default function Home() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determinar la ruta del dashboard según el rol del usuario
  const dashboardRoute =
    user?.publicMetadata?.role === "admin"
      ? "/dashboard/admin"
      : user?.publicMetadata?.role === "profesor"
      ? "/dashboard/profesores"
      : "/estudiantes"; // Ruta predeterminada para usuarios sin rol o estudiantes

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-grow items-center justify-center">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-7 text-5xl font-bold">
            Únete a nosotros y transforma tus ideas en
            <br /> realidades con el poder del conocimiento
          </h1>
          <p className="mb-7 text-xl">
            Bienvenido a Artiefy, tu plataforma digital educativa dedicada a
            impulsar <br /> tus proyectos con conocimientos de tecnología e
            innovación
          </p>
          <div>
            <SignedOut>
              <SignInButton>
                <Button className="p-7 text-2xl font-semibold active:scale-95">
                  COMIENZA YA
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                asChild
                className="p-7 text-2xl font-semibold active:scale-95"
              >
                <Link href={dashboardRoute}>DASHBOARD</Link>
              </Button>
            </SignedIn>
          </div>
          <div
              onClick={() => setIsModalOpen(true)}
              className="fixed bottom-4 right-6 hover:cursor-pointer"
              title="Información"
            >
              <Info className="size-10" />
            </div>
            <ModalError isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
      </main>
    </div>
  );
}
