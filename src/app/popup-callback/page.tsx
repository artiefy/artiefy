'use client';

import { useEffect } from 'react';

import { useClerk } from '@clerk/nextjs';

export default function PopupCallback() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const callbackIntent = new URLSearchParams(window.location.search).get(
      'intent'
    );
    let postedResult:
      | 'clerk:oauth:complete'
      | 'clerk:oauth:needs_signup'
      | null = null;

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

    const fallbackCompleteUrl =
      getSameOriginPath(searchParams.get('sign_in_force_redirect_url')) ??
      getSameOriginPath(searchParams.get('sign_up_force_redirect_url')) ??
      '/';

    const postToOpener = (
      type: 'clerk:oauth:complete' | 'clerk:oauth:needs_signup'
    ) => {
      if (!window.opener) {
        if (type === 'clerk:oauth:needs_signup') {
          window.location.replace('/sign-up');
        } else {
          window.location.replace(fallbackCompleteUrl);
        }
        return;
      }
      postedResult = type;
      window.opener.postMessage({ type }, window.location.origin);
    };

    const closePopup = () => {
      // Damos un pequeño margen para que el postMessage se entregue al opener.
      window.setTimeout(() => {
        window.close();
      }, 160);
    };

    const shouldRequestSignUp = (to: string) => {
      const normalized = to.toLowerCase();
      return (
        normalized.includes('/popup-callback/continue-sign-up') ||
        normalized.includes('/sign-up') ||
        (callbackIntent === 'signIn' && normalized.includes('/sign-in')) ||
        normalized.includes('show_signup=true')
      );
    };

    const finalize = async () => {
      try {
        await handleRedirectCallback(
          {
            continueSignUpUrl: '/popup-callback/continue-sign-up',
            transferable: true,
          },
          async (to) => {
            if (shouldRequestSignUp(to)) {
              postToOpener('clerk:oauth:needs_signup');
            } else {
              postToOpener('clerk:oauth:complete');
            }
            closePopup();
          }
        );

        if (!postedResult) {
          if (callbackIntent === 'signIn') {
            postToOpener('clerk:oauth:needs_signup');
          } else {
            postToOpener('clerk:oauth:complete');
          }
        }
        closePopup();
      } catch {
        postToOpener('clerk:oauth:needs_signup');
        closePopup();
      }
    };

    void finalize();
  }, [handleRedirectCallback]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div
          className="
            mb-4 inline-block size-8 animate-spin rounded-full border-4
            border-solid border-current border-r-transparent
          "
        />
        <p className="text-sm text-muted-foreground">
          Completando autenticación...
        </p>
      </div>
    </div>
  );
}
