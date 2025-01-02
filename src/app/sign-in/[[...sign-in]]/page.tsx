"use client";
import Image from "next/image";
import { AspectRatio } from "~/components/ui/aspect-ratio"; // Asegúrate de importar el componente

import * as Clerk from '@clerk/elements/common';
import * as SignInElements from '@clerk/elements/sign-in';

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

        {/* Componente de inicio de sesión personalizado */}
        <SignInElements.Root>
          <SignInElements.Step
            name="start"
            className="bg-white w-96 rounded-2xl py-10 px-8 shadow-sm border space-y-6"
          >
            <div className="grid grid-cols-2 gap-x-4">
              <Clerk.Connection
                name="google"
                className="flex items-center gap-x-3 justify-center font-medium border shadow-sm py-1.5 px-2.5 rounded-md"
              >
                <Clerk.Icon className="size-4" />
                Google
              </Clerk.Connection>
              <Clerk.Connection
                name="github"
                className="flex items-center gap-x-3 justify-center font-medium border shadow-sm py-1.5 px-2.5 rounded-md"
              >
                <Clerk.Icon className="size-4" />
                GitHub
              </Clerk.Connection>
            </div>
            <Clerk.Field name="identifier" className="space-y-2">
              <Clerk.Label className="text-sm font-medium">Email</Clerk.Label>
              <Clerk.Input className="w-full border rounded-md py-1.5 px-2.5" />
              <Clerk.FieldError className="block text-red-500 text-sm" />
            </Clerk.Field>
            <SignInElements.Action submit className="bg-black text-white rounded-md py-1.5 px-2.5">
              Continue
            </SignInElements.Action>
          </SignInElements.Step>
          <SignInElements.Step name="verifications">
            <SignInElements.Strategy name="email_code">
              <Clerk.Field name="code" className="space-y-2">
                <Clerk.Label className="text-sm font-medium">Code</Clerk.Label>
                <Clerk.Input className="w-full border rounded-md py-1.5 px-2.5" />
                <Clerk.FieldError className="block text-red-500 text-sm" />
              </Clerk.Field>
              <SignInElements.Action submit className="bg-black text-white rounded-md py-1.5 px-2.5">
                Continue
              </SignInElements.Action>
            </SignInElements.Strategy>
          </SignInElements.Step>
        </SignInElements.Root>
      </div>
    </div>
  );
}
