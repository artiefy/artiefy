
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect_url');
    if (redirectUrl) {
      void router.push(redirectUrl);
    }
  }, [router]);

  return <AuthenticateWithRedirectCallback />;
}