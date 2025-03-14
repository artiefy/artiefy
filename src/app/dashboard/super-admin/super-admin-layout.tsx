'use client';

import { Inter } from 'next/font/google';
import '~/styles/globals.css';
import { usePathname } from 'next/navigation';

import { ThemeEffect } from './components/admin/ui/theme-effect';
import { ThemeProvider } from './components/admin/ui/theme-provider';
import ResponsiveSidebar from './components/ResponsiveSidebar';

const inter = Inter({ subsets: ['latin'] });

export default function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const publicRoutes = ['/login', '/register'];
	const pathname = usePathname();
	const isPublicRoute = publicRoutes.includes(pathname);

	return (
		<div className={inter.className}>
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
							<main className="bg-background flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
								{children}
							</main>
						</div>
					</ResponsiveSidebar>
				) : (
					children
				)}
			</ThemeProvider>
		</div>
	);
}
