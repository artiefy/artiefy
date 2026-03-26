// src/app/sign-in/sso-callback/page.tsx
'use client';

import { useMemo } from 'react';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  const safeRedirect = useMemo(() => {
    if (typeof window === 'undefined') return '/';

    try {
      const raw = window.sessionStorage.getItem('mini_auth_redirect_url');
      if (!raw) return '/';

      const normalized = raw.trim();
      if (!normalized.startsWith('/')) return '/';
      if (normalized.startsWith('/sign-in')) return '/';

      return normalized;
    } catch {
      return '/';
    }
  }, []);

  return (
    <AuthenticateWithRedirectCallback
      signUpUrl="/sign-up"
      continueSignUpUrl="/sign-up/continue"
      signInUrl={safeRedirect}
    />
  );
}
