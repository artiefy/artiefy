import { type Metadata } from 'next'
import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations"
import { neobrutalism } from "@clerk/themes"
import { Montserrat } from 'next/font/google'
import { Toaster } from "~/components/ui/toaster"
import { CSPostHogProvider } from "./_analytics/provider"
import { globalMetadata } from '~/lib/metadata'
import Loading from "./loading"
import Head from 'next/head'

import "~/styles/globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
})

export const metadata: Metadata = globalMetadata

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
      appearance={{
        signIn: { baseTheme: neobrutalism },
        signUp: { baseTheme: neobrutalism },
      }}
    >
      <html lang="es" className={montserrat.variable}>
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
  )
}