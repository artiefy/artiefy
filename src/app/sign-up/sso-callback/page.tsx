'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useClerk } from '@clerk/nextjs';

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 SSO Sign-Up Callback ejecutándose...');
        console.log('URL actual:', window.location.href);

        await handleRedirectCallback({});
        // Si llega aquí, el OAuth sign-up fue exitoso
        router.push('/');
      } catch (err) {
        console.error('❌ Error en sign-up callback:', err);

        // Redirigir de vuelta al sign-up con el error
        const errorMessage = encodeURIComponent(
          'Error al crear la cuenta con OAuth. Por favor intenta de nuevo.'
        );
        router.push(`/?error=${errorMessage}&show_signup=true`);
      }
    };

    handleCallback();
  }, [handleRedirectCallback, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">
          Completando registro...
        </p>
      </div>
    </div>
  );
}
