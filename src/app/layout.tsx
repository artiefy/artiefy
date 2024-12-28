// src/app/layout.tsx
import { esMX } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { neobrutalism } from "@clerk/themes";
import { Josefin_Sans, Montserrat } from "next/font/google";
import { Toaster } from "~/components/ui/toaster"
import { CSPostHogProvider } from "./_analytics/provider";

import "../styles/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-josefin-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={esMX}
      appearance={{
        signIn: { baseTheme: neobrutalism },
        signUp: { baseTheme: neobrutalism },
      }}
    >
      <html
        lang="es"
        className={`${montserrat.variable} ${josefinSans.variable}`}
      >
        <CSPostHogProvider>
          <body>
            <main>{children}</main>
            <Toaster />
            </body>
        </CSPostHogProvider>
      </html>
    </ClerkProvider>
  );
}
