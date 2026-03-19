'use client';

import { useSearchParams } from 'next/navigation';

import { SignUp } from '@clerk/nextjs';

export default function Page() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect_url');
  const planId = searchParams?.get('plan_id');

  const getStoredRedirectUrl = () => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem('mini_auth_redirect_url');
    } catch {
      return null;
    }
  };

  const isWeakRedirect = (value: string | null) => {
    if (!value) return true;
    const normalized = value.trim().toLowerCase();
    return (
      normalized === '/' ||
      normalized === '/estudiantes' ||
      normalized.startsWith('/sign-in') ||
      normalized.startsWith('/sign-up')
    );
  };

  const isCourseAutoEnrollRedirect = (value: string | null) =>
    Boolean(
      value &&
      value.includes('/estudiantes/cursos/') &&
      value.includes('auto_enroll=1')
    );

  // Construir redirectUrl final con plan_id si existe
  const finalRedirectUrl = (() => {
    const storedRedirectUrl = getStoredRedirectUrl();
    let url =
      isWeakRedirect(redirectUrl) &&
      isCourseAutoEnrollRedirect(storedRedirectUrl)
        ? storedRedirectUrl!
        : (redirectUrl ?? storedRedirectUrl ?? '/estudiantes');

    if (planId && !url.includes('plan_id=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}plan_id=${planId}`;
    }
    return url;
  })();

  return (
    <div className="mt-5 flex justify-center py-5">
      <SignUp
        forceRedirectUrl={finalRedirectUrl}
        signInForceRedirectUrl={finalRedirectUrl}
        appearance={{
          options: {
            logoPlacement: 'inside', // Ubicación del logo: 'inside' o 'outside'
            privacyPageUrl: 'https://clerk.com/legal/privacy', // URL de tu política de privacidad
            animations: true, // Activa/desactiva las animaciones
            logoImageUrl: '/artiefy-logo2.svg', // URL de tu logo personalizado
            logoLinkUrl: '/', // URL al hacer clic en el logo
            socialButtonsPlacement: 'bottom',
            socialButtonsVariant: 'iconButton',
            termsPageUrl: 'https://clerk.com/terms',
            unsafe_disableDevelopmentModeWarnings: true,
          },
        }}
      />
    </div>
  );
}
