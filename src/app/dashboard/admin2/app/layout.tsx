import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { usePathname } from 'next/navigation';
import { Header } from '~/components/admin/ui/Header';
import { Sidebar } from '~/components/admin/ui/Sidebar';
import { ThemeEffect } from '~/components/admin/ui/theme-effect';
import { ThemeProvider } from '~/components/admin/ui/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dashboard Administrativo Educativo',
  description: 'Plataforma de gestión para administradores educativos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicRoutes = ['/login', '/register'];
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

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
            <div className="flex h-screen flex-col bg-background md:flex-row">
              <Sidebar>{children}</Sidebar>
              <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 md:p-6">
                  {children}
                </main>
              </div>
            </div>
          )}
          {isPublicRoute && children}
        </ThemeProvider>
      </body>
    </html>
  );
}
