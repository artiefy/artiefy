"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
export default function HomePage() {
  const { user } = useUser(); // Obtener datos del usuario autenticado

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar con los botones de autenticación */}
      <header className="flex items-center justify-between bg-blue-600 p-4 text-white">
        <div className="text-lg font-semibold">
          <Link href="/">Plataforma Educativa</Link>
        </div>
        <div className="flex space-x-4">
          <SignedOut>
            <SignInButton>
              <button className="rounded-md bg-blue-500 px-4 py-2">
                Iniciar sesión
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton showName />
          </SignedIn>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex flex-grow flex-col items-center justify-center p-4">
        <h1 className="mb-4 text-4xl font-bold">
          Bienvenido a la Plataforma Educativa
        </h1>
        <p className="mb-6 text-lg">
          Conéctate con tus cursos, profesores y compañeros de clase.
        </p>

        {/* Mostrar el botón "Comenzar" si el usuario no está autenticado */}
        <SignedOut>
          <div className="flex space-x-4">
            <Link
              href="/dashboard/estudiantes"
              className="rounded-md bg-blue-500 px-4 py-2 text-white"
            >
              Comenzar
            </Link>
          </div>
        </SignedOut>

        {/* Mostrar la información del usuario y el botón de dashboard si el usuario está autenticado */}
        <SignedIn>
          <div className="flex flex-col items-center">
            {user ? (
              <p className="mb-4 text-lg">
                ¡Estás conectado como {user.fullName}!
              </p>
            ) : (
              <p className="mb-4 text-lg">¡Estás conectado!</p>
            )}
            <Link
              href="/dashboard/estudiantes"
              className="rounded-md bg-blue-500 px-6 py-3 text-white"
            >
              Ir a mi Dashboard
            </Link>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
