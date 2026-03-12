'use client';

import { useEffect } from 'react';

export default function PopupContinueSignUp() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const getSameOriginPath = (rawUrl: string | null) => {
      if (!rawUrl) return null;
      try {
        const decoded = decodeURIComponent(rawUrl);
        if (decoded.startsWith('/')) return decoded;
        const parsed = new URL(decoded);
        if (parsed.origin === window.location.origin) {
          return `${parsed.pathname}${parsed.search}`;
        }
      } catch {
        return null;
      }
      return null;
    };

    const fallbackRedirectUrl =
      getSameOriginPath(searchParams.get('sign_up_force_redirect_url')) ??
      getSameOriginPath(searchParams.get('sign_in_force_redirect_url'));

    if (!window.opener) {
      const destination = fallbackRedirectUrl
        ? `/sign-up?redirect_url=${encodeURIComponent(fallbackRedirectUrl)}`
        : '/sign-up';
      window.location.replace(destination);
      return;
    }

    const notifyParent = () => {
      window.opener?.postMessage(
        { type: 'clerk:oauth:needs_signup' },
        window.location.origin
      );
    };

    notifyParent();
    const retryTimer = window.setTimeout(notifyParent, 120);
    const closeTimer = window.setTimeout(() => {
      window.close();
    }, 240);

    return () => {
      window.clearTimeout(retryTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Continuando registro...</p>
    </div>
  );
}
