'use client';

import { useState } from 'react';
import {
    Home,
    BookOpen,
    Users,
    GraduationCap,
    FileText,
    MessageSquare,
    Award,
    BarChart,
    PenToolIcon as Tool,
    Zap,
    Sun,
    Moon,
    LifeBuoy,
    Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '~/components/admin/ui/button';

const menuItems = [
    { icon: Home, text: 'Inicio', href: './' },
    { icon: BookOpen, text: 'Cursos', href: './app/cursos' },
    { icon: Users, text: 'Estudiantes', href: './app/estudiantes' },
    { icon: GraduationCap, text: 'Tutores', href: './app/tutores' },
    { icon: FileText, text: 'Recursos', href: './recursos' },
    { icon: MessageSquare, text: 'Foros', href: './foros' },
    { icon: LifeBuoy, text: 'Soporte', href: './soporte' },

    { icon: Award, text: 'Evaluaciones', href: './evaluaciones' },
    { icon: BarChart, text: 'Análisis', href: './analisis' },
    { icon: Tool, text: 'Configuración', href: './configuracion' },
    { icon: Zap, text: 'Gamificación', href: './gamificacion' },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-4 z-50 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu className="size-6" />
            </Button>
            <aside
                className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 md:static md:translate-x-0`}
            >
                <div className="py-4">
                    <div className="px-4 py-2">
                        <h1 className="text-2xl font-bold">EduDash</h1>
                    </div>
                    <nav className="mt-4">
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={`mx-2 flex items-center space-x-2 rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${
                                    pathname === item.href
                                        ? 'bg-gray-100 dark:bg-gray-700'
                                        : ''
                                }`}
                                onClick={() => setIsOpen(false)}
                            >
                                <item.icon className="size-5" />
                                <span>{item.text}</span>
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-4 px-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const newTheme =
                                    theme === 'dark' ? 'light' : 'dark';
                                setTheme(newTheme);
                                localStorage.setItem('theme', newTheme);
                            }}
                            className="flex w-full items-center justify-center gap-2"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="size-4" />
                                    <span>Cambiar a modo claro</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="size-4" />
                                    <span>Cambiar a modo oscuro</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
};
