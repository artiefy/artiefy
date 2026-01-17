'use client';

import { useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useClerk } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 SSO Callback ejecutándose...');
        console.log('URL actual:', window.location.href);

        await handleRedirectCallback({});

        // Si llega aquí, el OAuth fue exitoso
        const redirectUrl =
          searchParams.get('sign_in_force_redirect_url') || '/';
        router.push(redirectUrl);
      } catch (err) {
        console.error('❌ Error en callback:', err);

        let errorMessage = 'Error en el inicio de sesión';

        if (isClerkAPIResponseError(err)) {
          const accountNotFoundError = err.errors.find(
            (e) =>
              e.code === 'form_identifier_not_found' ||
              e.code === 'identifier_not_found'
          );

          if (accountNotFoundError) {
            // Redirigir directamente a sign-up cuando no se encuentra la cuenta
            router.push('/sign-up');
            return;
          } else {
            errorMessage = err.errors[0]?.message || errorMessage;
          }
        }

        // Redirigir de vuelta con el error para otros errores
        const redirectUrl =
          searchParams.get('sign_in_force_redirect_url') || '/';
        router.push(
          `${redirectUrl}?auth_error=${encodeURIComponent(errorMessage)}&show_signup=true`
        );
      }
    };

    handleCallback();
  }, [handleRedirectCallback, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Completando Autenticación...
        </p>
        <div className="mx-auto mt-2 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </div>
  );
}
