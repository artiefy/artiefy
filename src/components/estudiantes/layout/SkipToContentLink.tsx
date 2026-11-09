'use client';

import { usePathname } from 'next/navigation';

/** Id of the student-area content wrapper (see `src/app/estudiantes/layout.tsx`). */
export const STUDENT_CONTENT_ID = 'contenido-principal';

/**
 * Keyboard "skip to content" link. It must be the first focusable element, so
 * it renders from the root layout before the site header; it only shows in the
 * student area, where its target exists.
 */
export function SkipToContentLink() {
  const pathname = usePathname() ?? '/';
  if (!pathname.startsWith('/estudiantes')) return null;

  return (
    <a
      href={`#${STUDENT_CONTENT_ID}`}
      className="
        sr-only
        focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100020]
        focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm
        focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2
        focus:ring-primary
      "
    >
      Saltar al contenido
    </a>
  );
}
