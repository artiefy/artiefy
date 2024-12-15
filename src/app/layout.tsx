/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/app/layout.tsx
import { esMX } from "@clerk/localizations"; // Importa la localización en español
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={esMX}>
      <html lang="es">
        <body>
          {/* Coloca el componente aquí para ejecutar el hook */}
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
