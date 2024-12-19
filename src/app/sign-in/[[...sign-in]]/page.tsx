"use client";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { AspectRatio } from "~/components/ui/aspect-ratio"; // Asegúrate de importar el componente

export default function SignInPage() {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Imagen a la izquierda en pantallas grandes y abajo en pantallas pequeñas */}
      <div className="relative order-2 h-1/2 w-full md:order-1 md:h-full md:w-1/2">
        {/* En pantallas grandes (md o superiores) no usamos AspectRatio */}
        <div className="hidden h-full md:block">
          <Image
            src="/login-estudiantes.webp"
            alt="Imagen de login"
            fill
            style={{ objectFit: "cover" }} // Asegura que la imagen ocupe toda la mitad
            priority
            quality={100}
          />
        </div>
        {/* En pantallas pequeñas usamos AspectRatio */}
        <div className="block md:hidden">
          <AspectRatio ratio={16 / 9}>
            <Image
              src="/login-estudiantes.webp"
              alt="Imagen de login"
              fill
              style={{ objectFit: "cover" }}
              priority
              quality={100}
            />
          </AspectRatio>
        </div>
      </div>

      {/* Formulario de inicio de sesión */}
      <div className="order-1 flex flex-1 flex-col items-center justify-center p-8 md:order-2 md:w-1/2">
        {/* Título estático */}
        <div className="mb-6 text-center">
          <h1 className="mb-4 text-6xl font-extrabold">ARTIEFY</h1>
          <h2 className="text-2xl font-medium">BIENVENIDO</h2>
        </div>

        {/* Componente de inicio de sesión */}
        <SignIn
          routing="path"
          path="/sign-in"
          appearance={{
            layout: {
              logoPlacement: "inside", // Ubicación del logo: 'inside' o 'outside'
              privacyPageUrl: "https://clerk.com/legal/privacy", // URL de tu política de privacidad
              animations: true, // Activa/desactiva las animaciones
              logoImageUrl: "/logo-artiefy.webp", // URL de tu logo personalizado
              logoLinkUrl: "/", // URL al hacer clic en el logo
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
              termsPageUrl: "https://clerk.com/terms",
              unsafe_disableDevelopmentModeWarnings: true
            },
          }}
        />
      </div>
    </div>
  );
}
