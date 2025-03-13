'use client';

import { Inter } from 'next/font/google';
import '~/styles/globals.css';
import { usePathname } from 'next/navigation';

import ResponsiveSidebar from '~/components/admin/ui/Sidebar';
import { ThemeEffect } from '~/components/admin/ui/theme-effect';
import { ThemeProvider } from '~/components/admin/ui/theme-provider';

const inter = Inter({ subsets: ['latin'] });

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
          {!isPublicRoute ? (
            <ResponsiveSidebar>
              <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 md:p-6">
                  {children}
                </main>
              </div>
            </ResponsiveSidebar>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
