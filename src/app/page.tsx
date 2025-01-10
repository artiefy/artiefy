"use client";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { FaArrowRight } from "react-icons/fa"; // Importa el icono de flecha
import SmoothGradient from "~/components/layout/Gradient";
import { Header } from "~/components/layout/Header";
import { Button as UiButton } from "~/components/ui/button";
import { Icons } from "~/components/ui/icons"; // Importa el ícono de carga

export default function Home() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  // Determinar la ruta del dashboard según el rol del usuario
  const dashboardRoute =
    user?.publicMetadata?.role === "admin"
      ? "/dashboard/admin"
      : user?.publicMetadata?.role === "profesor"
        ? "/dashboard/educadores"
        : "/estudiantes";

  const handleButtonClick = () => {
    setLoading(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <SmoothGradient />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="mt-[-10vh] flex flex-grow items-center justify-center">
          {" "}
          {/* Ajusta el margen superior */}
          <section className="container mx-auto px-4 py-12 text-center">
            {" "}
            {/* Ajusta el padding */}
            <h1 className="mb-5 text-5xl font-bold leading-snug text-white">
              {" "}
              {/* Ajusta el margen inferior */}
              Únete a nosotros y transforma tus ideas en
              <br /> realidades con el{" "}
              <span className="text-primary">poder del conocimiento</span>
            </h1>
            <p className="mb-5 text-xl leading-snug">
              {" "}
              {/* Ajusta el margen inferior */}
              Bienvenido a Artiefy, tu plataforma digital educativa dedicada a
              impulsar <br /> tus conociminetos con ciencia y tecnología.
            </p>
            <div>
              <SignedOut>
                <SignInButton>
                <UiButton
                  asChild
                  className="border border-primary hover:text-primary cta relative skew-x-[-20deg] transform rounded-none bg-primary py-8 text-2xl font-semibold italic text-background hover:border-primary hover:bg-transparent active:scale-95"
                  style={{
                    boxShadow: "6px 6px 0 black",
                    transition: "0.5s",
                    width: "250px",
                  }}
                  onClick={handleButtonClick}
                >
                  <Link href={dashboardRoute}>
                    <div className="flex w-full items-center justify-center">
                      {loading ? (
                        <Icons.spinner
                          className="animate-spin"
                          style={{ height: "32px", width: "32px" }}
                        />
                      ) : (
                        <>
                          <span className="inline-block skew-x-[15deg] transform">
                            COMIENZA YA
                          </span>
                          <FaArrowRight className="animate-bounce-right second ml-2 inline-block skew-x-[15deg] transform transition-transform duration-500" />
                        </>
                      )}
                    </div>
                  </Link>
                </UiButton>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UiButton
                  asChild
                  className="border border-primary hover:text-primary cta relative skew-x-[-20deg] transform rounded-none bg-primary py-8 text-2xl font-semibold italic text-background hover:border-primary hover:bg-transparent active:scale-95"
                  style={{
                    boxShadow: "6px 6px 0 black",
                    transition: "0.5s",
                    width: "250px",
                  }}
                  onClick={handleButtonClick}
                >
                  <Link href={dashboardRoute}>
                    <div className="flex w-full items-center justify-center">
                      {loading ? (
                        <Icons.spinner
                          className="animate-spin"
                          style={{ height: "32px", width: "32px" }}
                        />
                      ) : (
                        <>
                          <span className="inline-block skew-x-[15deg] transform">
                            COMIENZA YA
                          </span>
                          <FaArrowRight className="animate-bounce-right second ml-2 inline-block skew-x-[15deg] transform transition-transform duration-500" />
                        </>
                      )}
                    </div>
                  </Link>
                </UiButton>
              </SignedIn>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
