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
                name: globalMetadata.title,
                description: globalMetadata.description,
                url: globalMetadata.metadataBase?.toString(),
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${globalMetadata.metadataBase?.toString()}search?q={search_term_string}`
                  },
                  "query-input": "required name=search_term_string"
                },
                sameAs: [
                  "https://twitter.com/artiefy",
                  // Add other social media profiles here
                ],
                author: {
                  "@type": "Organization",
                  name: "Equipo Artiefy",
                  url: globalMetadata.metadataBase?.toString()
                },
                publisher: {
                  "@type": "Organization",
                  name: "Artiefy",
                  logo: {
                    "@type": "ImageObject",
                    url: `${globalMetadata.metadataBase?.toString()}artiefy-icon.png`
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

