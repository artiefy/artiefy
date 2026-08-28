'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker once on the client.
 * Rendered in the root layout; renders nothing.
 *
 * Production only. The worker exists to make the app installable and to serve
 * the offline fallback, neither of which a dev server benefits from, while a
 * failed dev registration surfaces as a console error in the Next overlay.
 * Nothing about the production PWA changes: manifest, icons, offline page and
 * installability all still ship.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
