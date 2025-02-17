"use client"; // ✅ Necesario porque usa hooks y Clerk

import { useEffect } from "react";
import { esMX } from "@clerk/localizations";
import { ClerkLoaded, ClerkLoading, ClerkProvider, useUser } from "@clerk/nextjs";
import { Montserrat } from "next/font/google";

import Provider from "~/components/estudiantes/layout/ProgressBarProvider";
import { Toaster } from "~/components/estudiantes/ui/toaster";
import usePageTimeTracker from "~/hooks/usePageTimeTracker";

import Loading from "./loading";
import "~/styles/globals.css";

// 🔹 Configuración de fuente Montserrat
const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

// 🔹 Datos estructurados para SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://artiefy.vercel.app",
  name: "Artiefy",
  description: "Artiefy es la plataforma de aprendizaje más innovadora para estudiantes y profesores.",
  logo: {
    "@type": "ImageObject",
    url: "https://artiefy.vercel.app/artiefy-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={esMX}>
      <html lang="es" className={`${montserrat.variable}`}>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd),
            }}
          />
        </head>
        <body className="bg-background text-primary font-sans">
          {/* 🔄 Carga inicial de Clerk */}
          <ClerkLoading>
            <Loading />
          </ClerkLoading>
          
          <ClerkLoaded>
            {/* 🚀 Maneja el rastreo del usuario autenticado */}
            <UserTracker />
            <Provider>{children}</Provider>
            <Toaster />
          </ClerkLoaded>
        </body>
      </html>
    </ClerkProvider>
  );
}

/** 🔹 Componente separado para manejar `useUser()` y `useEffect` correctamente */
function UserTracker() {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      console.log(`✅ Usuario autenticado: ${user.id}`);
    }
  }, [user]);

  // 🔥 Activa el rastreo SOLO si hay usuario autenticado
  usePageTimeTracker(user?.id ?? null); // Assuming courseId is null for now

  return null;
}
