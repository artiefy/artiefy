"use client"
// Ruta: /sign-in/[[...sign-in]]/page.tsx
import { useSearchParams, usePathname } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Detectar el rol basado en la ruta o `redirect_url`
    if (pathname.includes("admin")) setRole("admin");
    else if (pathname.includes("profesores")) setRole("profesor");
    else if (pathname.includes("estudiantes")) setRole("estudiante");
    else {
      const redirectUrl = searchParams.get("redirect_url");
      if (redirectUrl?.includes("/dashboard/admin")) setRole("admin");
      else if (redirectUrl?.includes("/dashboard/profesores")) setRole("profesor");
      else if (redirectUrl?.includes("/dashboard/estudiantes")) setRole("estudiante");
    }
  }, [pathname, searchParams]);

  // Seleccionar contenido dinámico para cada rol
  const getImageForRole = (role: string | null) => {
    switch (role) {
      case "admin":
        return "/images/admin-login.jpg";
      case "profesor":
        return "/images/profesor-login.jpg";
      case "estudiante":
        return "/images/estudiante-login.jpg";
      default:
        return "/images/default-login.jpg";
    }
  };

  const getWelcomeTextForRole = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Bienvenido al portal de administración.";
      case "profesor":
        return "Accede al portal para profesores.";
      case "estudiante":
        return "Bienvenido al portal para estudiantes.";
      default:
        return "Inicia sesión para continuar.";
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Imagen del lado izquierdo */}
      <div
        style={{
          flex: 1,
          backgroundImage: `url(${getImageForRole(role)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>

      {/* Formulario del lado derecho */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
        }}
      >
        <h1>{getWelcomeTextForRole(role)}</h1>
        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl={searchParams.get("redirect_url") ?? "/dashboard"}
        />
      </div>
    </div>
  );
}
