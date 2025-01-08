import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '~/components/ui/Sidebar'
import { Header } from '~/components/ui/Header'
import { ThemeProvider } from "~/components/ui/theme-provider"
import { ThemeEffect } from '~/components/ui/theme-effect'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dashboard Administrativo Educativo',
  description: 'Plataforma de gestión para administradores educativos',
}

export default function RootLayout({
  children,
  isPublicRoute,
}: {
  children: React.ReactNode
  isPublicRoute: boolean
}) {
  //const publicRoutes = ['/login', '/register']
  //const pathname = usePathname()
  //const isPublicRoute = publicRoutes.includes(pathname)

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="edudash-theme"
        >
          <ThemeEffect />
          {!isPublicRoute && (
            <div className="flex flex-col md:flex-row h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6">
                  {children}
                </main>
              </div>
            </div>
          )}
          {isPublicRoute && children}
        </ThemeProvider>
      </body>
    </html>
  )
}

