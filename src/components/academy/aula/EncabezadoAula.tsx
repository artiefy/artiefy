'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserButton } from '@clerk/nextjs';
import { BookOpen, Home } from 'lucide-react';

import { CambiarVistaAcademia } from '~/components/academy/CambiarVistaAcademia';
import { useMarca } from '~/components/marca/MarcaProvider';
import { cn } from '~/lib/utils';

import type { Route } from 'next';

// Barra superior del estudiante de una academia, como el Header del
// estudiante de Artiefy: logo de la academia, navegación y cuenta.

const NAV: { href: string; label: string; icon: typeof Home }[] = [
  { href: '/dashboard/student', label: 'Inicio', icon: Home },
  {
    href: '/dashboard/student/mi-aprendizaje',
    label: 'Mis cursos',
    icon: BookOpen,
  },
];

export function EncabezadoAula() {
  const marca = useMarca();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href={'/dashboard/student' as Route}
          className="flex shrink-0 items-center gap-2"
        >
          {marca.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={marca.logoUrl}
              alt={marca.nombre}
              className="h-9 max-w-[160px] object-contain"
            />
          ) : (
            <span className="text-lg font-black text-primary">
              {marca.nombre}
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icono }) => {
            const activo =
              href === '/dashboard/student'
                ? pathname === href
                : pathname.startsWith('/dashboard/student/mi-aprendizaje') ||
                  pathname.startsWith('/dashboard/student/cursos');
            return (
              <Link
                key={href}
                href={href as Route}
                className={cn(
                  'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  activo ? 'text-white' : 'text-white/60 hover:text-white'
                )}
              >
                <Icono className="size-4 sm:hidden" />
                <span className="hidden sm:inline">{label}</span>
                {activo && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <CambiarVistaAcademia />
          <UserButton
            appearance={{
              elements: { userButtonAvatarBox: '!size-9 !rounded-full' },
            }}
          />
        </div>
      </div>
    </header>
  );
}
