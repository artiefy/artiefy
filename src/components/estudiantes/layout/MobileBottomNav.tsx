'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BookOpen, Layers, Plus, Search, User } from 'lucide-react';

interface MobileBottomNavProps {
  isSignedIn: boolean;
  onSearchClick: () => void;
  onLoginClick: () => void;
}

/**
 * Floating bottom navigation bar shown only on small screens.
 * The center "+" button is intentionally inert for now.
 * It shrinks (hides labels, reduces padding) while scrolling down and
 * expands again when scrolling up or at the top of the page.
 */
export function MobileBottomNav({
  isSignedIn,
  onSearchClick,
  onLoginClick,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  // Hide the bar while the enroll/subscribe CTA bar owns the bottom of the
  // screen (non-enrolled course/program pages). ProgramHeader/CourseDetails
  // toggle `html.mobile-bottom-cta-visible` and emit this event.
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const readState = () =>
      setCtaVisible(
        document.documentElement.classList.contains('mobile-bottom-cta-visible')
      );

    readState();

    const onCtaChange = (event: Event) => {
      const detail = (event as CustomEvent<{ visible?: boolean }>).detail;
      setCtaVisible(Boolean(detail?.visible));
    };

    window.addEventListener('mobile-bottom-cta-visibility-change', onCtaChange);
    return () =>
      window.removeEventListener(
        'mobile-bottom-cta-visibility-change',
        onCtaChange
      );
  }, []);

  // Reserve space at the bottom of the page so the fixed bar never covers
  // content. Scoped to mobile via the CSS media query in globals.css.
  // Skip it while the CTA bar is shown so it can sit flush at the bottom.
  useEffect(() => {
    if (ctaVisible) {
      document.body.classList.remove('has-bottom-nav');
      return;
    }
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, [ctaVisible]);

  // Shrink the bar while scrolling down, expand while scrolling up / at top.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (y > lastY && y > 60) {
        setCompact(true);
      } else if (y < lastY) {
        setCompact(false);
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string, exact = false) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const itemClass = (active: boolean) => `
    relative z-10 transition-colors
    ${active ? 'text-primary' : 'text-muted-foreground'}
  `;

  const labelClass = (active: boolean) => `
    overflow-hidden text-[10px] leading-tight font-medium transition-all
    duration-300 ease-out
    ${active ? 'text-primary' : 'text-muted-foreground'}
    ${compact ? 'mt-0 max-h-0 opacity-0' : 'mt-0.5 max-h-4 opacity-100'}
  `;

  const buttonClass = `
    group flex flex-1 flex-col items-center justify-center rounded-full px-2
    transition-all duration-300 ease-out
    active:scale-95
    ${compact ? 'py-1' : 'py-2'}
  `;

  // The enroll/subscribe CTA bar owns the bottom of the screen; step aside.
  if (ctaVisible) return null;

  return (
    <div
      className="
        js-mobile-bottom-nav pointer-events-none fixed inset-x-0 bottom-0
        z-[2147483000] flex
        justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]
        md:hidden
      "
    >
      <nav
        aria-label="Navegación inferior"
        className={`
          liquid-glass pointer-events-auto flex w-full max-w-sm items-center
          justify-between rounded-full px-2 transition-all duration-300 ease-out
          ${compact ? 'py-1' : 'py-2'}
        `}
        style={{
          backgroundColor: 'rgba(1, 21, 45, 0.78)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <Link href="/estudiantes" aria-label="Cursos" className={buttonClass}>
          <BookOpen
            className={`size-[22px] ${itemClass(isActive('/estudiantes', true))}`}
          />
          <span className={labelClass(isActive('/estudiantes', true))}>
            Cursos
          </span>
        </Link>

        <Link href="/proyectos" aria-label="Proyectos" className={buttonClass}>
          <Layers
            className={`size-[22px] ${itemClass(isActive('/proyectos'))}`}
          />
          <span className={labelClass(isActive('/proyectos'))}>Proyectos</span>
        </Link>

        {/* Center create button — intentionally inert for now */}
        <button type="button" aria-label="Crear" className={buttonClass}>
          <span
            className={`
              -mt-1 flex items-center justify-center rounded-full
              bg-gradient-to-br from-primary to-primary/70
              text-primary-foreground transition-all duration-300
              group-hover:scale-105 group-active:scale-95
              ${compact ? 'size-9' : 'size-11'}
            `}
            style={{ boxShadow: '0 4px 24px rgba(34, 196, 211, 0.6)' }}
          >
            <Plus className="size-5" />
          </span>
        </button>

        <button
          type="button"
          aria-label="Buscar"
          onClick={onSearchClick}
          className={buttonClass}
        >
          <Search className="size-[22px] text-muted-foreground" />
          <span className={labelClass(false)}>Buscar</span>
        </button>

        {isSignedIn ? (
          <Link
            href="/estudiantes/perfil"
            aria-label="Perfil"
            className={buttonClass}
          >
            <User
              className={`size-[22px] ${itemClass(isActive('/estudiantes/perfil'))}`}
            />
            <span className={labelClass(isActive('/estudiantes/perfil'))}>
              Perfil
            </span>
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Iniciar sesión"
            onClick={onLoginClick}
            className={buttonClass}
          >
            <User className="size-[22px] text-muted-foreground" />
            <span className={labelClass(false)}>Perfil</span>
          </button>
        )}
      </nav>
    </div>
  );
}
