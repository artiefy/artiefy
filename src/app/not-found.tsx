/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center h-screen bg-background text-gray-800 p-5">
      <img src="/error-404.png" alt="Not Found" className="max-w-full h-auto mb-8" />
      <h1 className="text-4xl font-bold mb-4 text-orange-500">404 - Página no encontrada</h1>
      <p className="text-lg mb-8 text-primary">
        Lo sentimos, pero la página que buscas no está disponible. Puede que el
        enlace esté roto o que la página haya sido movida.
      </p>
      <Link href="/" className="text-lg text-blue-500 underline mb-6 border border-zinc-600 rounded-lg p-5">
        Volver al inicio
      </Link>
    </div>
  );
}
