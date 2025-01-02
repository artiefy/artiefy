import { type Metadata } from 'next'
import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations"
import { neobrutalism } from "@clerk/themes"
import { Montserrat } from 'next/font/google'
import { Toaster } from "~/components/ui/toaster"
import { CSPostHogProvider } from "./_analytics/provider"
import { globalMetadata } from '~/lib/metadata'
import  Loading  from "./loading"

import "~/styles/globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
})

export const metadata: Metadata = globalMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      localization={esMX}
      appearance={{
        signIn: { baseTheme: neobrutalism },
        signUp: { baseTheme: neobrutalism },
      }}
    >
      <html lang="es" className={montserrat.variable}>
      <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Artiefy",
                "description": "Artiefy es la plataforma de aprendizaje más innovadora para estudiantes y profesores.",
                "url": "https://artiefy.vercel.app",
                "inLanguage": "es",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://artiefy.vercel.app/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "Artiefy",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://artiefy.vercel.app/artiefy-icon.png",
                    "width": "512",
                    "height": "512"
                  }
                }
              })
            }}
          />
        </head>
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
  )
}

