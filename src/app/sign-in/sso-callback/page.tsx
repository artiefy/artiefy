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
    const redirectUrl = searchParams
      ? getRedirectUrlFromSearchParams(searchParams)
      : '/';
    const flow = searchParams?.get('flow');
    const planId = searchParams?.get('plan_id');

    if (flow === 'modal') {
      const redirect = new URL(redirectUrl, 'http://local');
      if (planId && !redirect.searchParams.has('plan_id')) {
        redirect.searchParams.set('plan_id', planId);
      }
      redirect.searchParams.set('show_signup', 'true');
      return `${redirect.pathname}${redirect.search}`;
    }

    const params = new URLSearchParams();
    params.set('redirect_url', redirectUrl);
    if (planId) {
      params.set('plan_id', planId);
    }

    return `/sign-up?${params.toString()}`;
  }, [searchParams]);

  return (
    <AuthenticateWithRedirectCallback
      continueSignUpUrl={continueSignUpUrl}
      transferable
    />
  );
}
