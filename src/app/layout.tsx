import { esMX } from "@clerk/localizations";
import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/nextjs";
import { neobrutalism } from "@clerk/themes";
import { Josefin_Sans, Montserrat } from "next/font/google";
import Head from "next/head";
import { Toaster } from "~/components/ui/toaster";
import { globalMetadata } from "../lib/metadata";
import { CSPostHogProvider } from "./_analytics/provider";
import Loading from "./loading";

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

export const metadata = globalMetadata;

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
      afterSignOutUrl="/"
    >
      <html
        lang="es"
        className={`${montserrat.variable} ${josefinSans.variable}`}
      >
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Artiefy",
                url: "https://artiefy.vercel.app",
                potentialAction: {
                  "@type": "SearchAction",
                  target:
                    "https://artiefy.vercel.app/search?query={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              }),
            }}
          />
        </Head>
        <CSPostHogProvider>
          <body>
            <ClerkLoading>
              <Loading />
            </ClerkLoading>
            <ClerkLoaded>
              <main>{children}</main>
              <Toaster />
            </ClerkLoaded>
          </body>
        </CSPostHogProvider>
      </html>
    </ClerkProvider>
  );
}
