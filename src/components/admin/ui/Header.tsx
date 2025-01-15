'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '~/components/admin/ui/breadcrumbs';
import { Button } from '~/components/admin/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '~/components/admin/ui/dropdown-menu';
import { ModeToggle } from '~/components/admin/ui/mode-toggle';
import { NotificationsDropdown } from '~/components/admin/ui/NotificationsDropdown';

export function Header() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block">
                            Dashboard Educativo
                        </span>
                    </Link>
                </div>
                <div className="flex-1 md:flex-none">
                    <Breadcrumb />
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <nav className="flex items-center space-x-2">
                        <NotificationsDropdown />
                        <ModeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <User className="size-5" />
                                    <span className="sr-only">
                                        Perfil de usuario
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">Ver Perfil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">Configuración</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>
                                    Cerrar Sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </div>
        </header>
    );
}
