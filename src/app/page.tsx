"use client";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import SmoothGradient from "~/components/layout/Gradient";
import { Header } from "~/components/layout/Header";
import { Button as UiButton } from "~/components/ui/button";
import { FaArrowRight } from "react-icons/fa"; // Importa el icono de flecha

export default function Home() {
  const { user } = useUser();

  // Determinar la ruta del dashboard según el rol del usuario
  const dashboardRoute =
    user?.publicMetadata?.role === "admin"
      ? "/dashboard/admin"
      : user?.publicMetadata?.role === "profesor"
        ? "/dashboard/profesores"
        : "/estudiantes"; // Ruta predeterminada para usuarios sin rol o estudiantes

  return (
    <div className="relative flex min-h-screen flex-col">
      <SmoothGradient />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-grow items-center justify-center mt-[-10vh]"> {/* Ajusta el margen superior */}
          <section className="container mx-auto px-4 py-12 text-center"> {/* Ajusta el padding */}
            <h1 className="mb-5 text-5xl font-bold leading-snug text-white"> {/* Ajusta el margen inferior */}
              Únete a nosotros y transforma tus ideas en
              <br /> realidades con el{" "}
              <span className="text-primary">poder del conocimiento</span>
            </h1>
            <p className="mb-5 text-xl leading-snug"> {/* Ajusta el margen inferior */}
              Bienvenido a Artiefy, tu plataforma digital educativa dedicada a
              impulsar <br /> tus conociminetos con ciencia y tecnología.
            </p>
            <div>
              <SignedOut>
                <SignInButton>
                  <UiButton
                    className="cta rounded-none relative p-7 text-2xl font-semibold italic text-background active:scale-95 bg-primary transform skew-x-[-20deg] hover:text-white"
                    style={{
                      boxShadow: "6px 6px 0 black",
                      transition: "0.5s",
                    }}
                  >
                    <span className="inline-block transform skew-x-[15deg]">COMIENZA YA</span>
                    <FaArrowRight className="animate-bounce-right second inline-block transform skew-x-[15deg] ml-2 transition-transform duration-500" />
                  </UiButton>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UiButton
                  asChild
                  className="p-5 text-2xl font-semibold active:scale-95"
                >
                  <Link href={dashboardRoute}>INICIO</Link>
                </UiButton>
              </SignedIn>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}