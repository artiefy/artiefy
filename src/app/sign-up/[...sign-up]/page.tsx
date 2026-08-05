'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import MiniSignUpModal from '~/components/estudiantes/layout/MiniSignUpModal';

export default function Page() {
  const router = useRouter();
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

  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(finalRedirectUrl)}`;

  return (
    <div className="mt-5 flex justify-center px-4 py-5">
      <MiniSignUpModal
        variant="page"
        isOpen
        onClose={() => undefined}
        onSignUpSuccess={() => undefined}
        redirectUrl={finalRedirectUrl}
        onSwitchToLogin={() => router.push(signInHref)}
      />
    </div>
  );
}
