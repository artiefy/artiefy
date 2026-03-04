'use client';

import { useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

const getRedirectUrlFromSearchParams = (searchParams: URLSearchParams) => {
  const rawRedirectUrl =
    searchParams.get('redirect_url') ??
    searchParams.get('sign_up_fallback_redirect_url') ??
    searchParams.get('sign_in_fallback_redirect_url');

  if (!rawRedirectUrl) return '/';

  try {
    const decoded = decodeURIComponent(rawRedirectUrl);

    // Si viene absoluta y del mismo origen, devolvemos path relativo.
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      const parsed = new URL(decoded);
      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}`;
      }
      return '/';
    }

    return decoded.startsWith('/') ? decoded : '/';
  } catch {
    return '/';
  }
};

export default function SSOCallback() {
  const searchParams = useSearchParams();

  const continueSignUpUrl = useMemo(() => {
    if (!searchParams) return '/?show_signup=true';
    const basePath = getRedirectUrlFromSearchParams(searchParams);
    const separator = basePath.includes('?') ? '&' : '?';
    return `${basePath}${separator}show_signup=true`;
  }, [searchParams]);

  return (
    <>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl={continueSignUpUrl}
        transferable
      />
      <div id="clerk-captcha" />
    </>
  );
}
