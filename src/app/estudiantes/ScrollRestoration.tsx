'use client';

import { useEffect } from 'react';

const SCROLL_KEY = 'estudiantes-refresh-scroll-y';
const MAX_RESTORE_DURATION_MS = 2000;

// Restores the scroll position after a full browser refresh on /estudiantes.
// The page streams content in via Suspense after mount, so the document can
// still be growing taller when we first try to scroll; keep retrying on each
// frame until we land close to the target, reach the bottom of the page, or
// hit the time budget.
export function ScrollRestoration() {
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    const targetY = saved ? Number.parseInt(saved, 10) : NaN;

    if (Number.isFinite(targetY) && targetY > 0) {
      const start = performance.now();

      const tryRestore = () => {
        window.scrollTo(0, targetY);

        const closeEnough = Math.abs(window.scrollY - targetY) < 2;
        const atBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 1;
        const elapsed = performance.now() - start;

        if (!closeEnough && !atBottom && elapsed < MAX_RESTORE_DURATION_MS) {
          requestAnimationFrame(tryRestore);
        }
      };

      requestAnimationFrame(tryRestore);
    }

    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };

    // Persist continuously (rAF-throttled) rather than only at unload time:
    // something can reset window.scrollY before the unload handlers run
    // (streaming content resizing the page, in-flight scroll animations),
    // which would otherwise save a stale 0 right as the user refreshes.
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        saveScroll();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('beforeunload', saveScroll);
    window.addEventListener('pagehide', saveScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('beforeunload', saveScroll);
      window.removeEventListener('pagehide', saveScroll);
    };
  }, []);

  return null;
}
