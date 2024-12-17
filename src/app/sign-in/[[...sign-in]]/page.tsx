"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {

  return (
    <div className="flex h-screen">
      {/* Imagen del lado izquierdo */}
      <div
        className="flex-1 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.webp')" }}
      ></div>

      {/* Formulario del lado derecho */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        {/* Título estático */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-extrabold text-[#3AF4EF] mb-4">ARTIEFY</h1>
          <h2 className="text-2xl font-medium text-gray-700">BIENVENIDO</h2>
        </div>

        {/* Componente de inicio de sesión */}
        <SignIn
          routing="path"
          path="/sign-in"
        />
      </div>
    </div>
  );
}
