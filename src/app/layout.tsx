import type { Metadata } from 'next'
import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations"
import { Montserrat } from 'next/font/google'
import { Toaster } from "~/components/ui/toaster"
import { CSPostHogProvider } from "./_analytics/provider"
import { metadata as siteMetadata } from '~/lib/metadata'
import Loading from "./loading"
import Providers from '~/components/layout/ProgressBarProvider';
import "~/styles/globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
})

export const metadata: Metadata = siteMetadata

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'url': 'https://artiefy.vercel.app',
  'name': 'Artiefy',
  'description': 'Artiefy es la plataforma de aprendizaje más innovadora para estudiantes y profesores.',
  'logo': {
    '@type': 'ImageObject',
    'url': 'https://artiefy.vercel.app/artiefy-icon.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <ClerkProvider
      localization={esMX}
      signUpFallbackRedirectUrl="/"
      signInFallbackRedirectUrl="/"
    >
      <html lang="es" className={montserrat.variable}>
        <head>
          <script
            type="application/ld+json"
<<<<<<< HEAD
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Artiefy",
                url: "https://artiefy.vercel.app",
                sameAs: [
                  "https://www.facebook.com/artiefy",
                  "https://www.twitter.com/artiefy",
                  "https://www.instagram.com/artiefy"
                ],
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://artiefy.vercel.app/search?query={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              }),
            }}
=======
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
>>>>>>> develop
          />
          </head>
        <CSPostHogProvider>
          <body>
            <ClerkLoading>
              <Loading />
            </ClerkLoading>
            <ClerkLoaded>
            <Providers>{children}</Providers>
            <Toaster />
            </ClerkLoaded>
          </body>
        </CSPostHogProvider>
      </html>
    </ClerkProvider>
  )
}