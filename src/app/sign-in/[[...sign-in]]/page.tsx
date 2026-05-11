'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth, useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/shared/types';

import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Icons } from '~/components/estudiantes/ui/icons';

import Loading from '../../loading';

const toClerkApiErrors = (error: unknown): ClerkAPIError[] => {
  if (isClerkAPIResponseError(error)) {
    return error.errors;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const code =
      typeof record.code === 'string' ? record.code : 'unknown_error';
    const message =
      typeof record.message === 'string'
        ? record.message
        : 'Ocurrió un error desconocido';
    const longMessage =
      typeof record.longMessage === 'string' ? record.longMessage : message;

    return [
      {
        code,
        message,
        longMessage,
        meta: {},
      },
    ];
  }

  return [
    {
      code: 'unknown_error',
      message: 'Ocurrió un error desconocido',
      longMessage: 'Ocurrió un error desconocido',
      meta: {},
    },
  ];
};

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(
    null
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extraer email de los parámetros de búsqueda para pre-rellenar
  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        try {
          setEmail(decodeURIComponent(emailParam));
        } catch {
          setEmail(emailParam);
        }
      }
    }
  }, [searchParams]);

  const getStoredMiniRedirect = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem('mini_auth_redirect_url');
      return raw ? decodeURIComponent(raw) : null;
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

  // Función para extraer redirect_url sin importar si está en query param o hash
  const getRedirectUrl = () => {
    // Primero intentamos obtenerlo de los query params normales
    let redirectUrl = searchParams?.get('redirect_url');

    // Si no encontramos en query params, buscamos en el hash
    if (!redirectUrl && typeof window !== 'undefined') {
      try {
        // Extraer los parámetros del hash
        const hashString = window.location.hash.substring(2); // Remover '#/'
        const hashParams = new URLSearchParams(hashString);

        // Intentar obtener redirect_url del hash
        redirectUrl =
          hashParams.get('redirect_url') ??
          hashParams.get('sign_in_fallback_redirect_url');
      } catch (error) {
        console.error('Error parsing hash params:', error);
      }
    }

    const storedMiniRedirect = getStoredMiniRedirect();

    // Decodificar la URL si está codificada y usar fallback si es necesario
    try {
      const decodedRedirect = redirectUrl
        ? decodeURIComponent(redirectUrl)
        : null;

      if (
        isWeakRedirect(decodedRedirect) &&
        isCourseAutoEnrollRedirect(storedMiniRedirect)
      ) {
        return storedMiniRedirect!;
      }

      return decodedRedirect ?? storedMiniRedirect ?? '/estudiantes';
    } catch (error) {
      console.error('Error decoding redirect URL:', error);
      return storedMiniRedirect ?? '/estudiantes';
    }
  };

  // Extraer plan_id de los query params
  const planId = searchParams?.get('plan_id');

  // Modificar redirectUrl para incluir plan_id si existe
  const redirectUrl = (() => {
    let url = getRedirectUrl();
    if (planId && !url.includes('plan_id=')) {
      // Añadir plan_id como query param
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}plan_id=${planId}`;
    }
    return url;
  })();

  console.log('✅ Redirect URL detectada:', redirectUrl);

  useEffect(() => {
    if (isSignedIn) {
      console.log('🔄 Usuario autenticado, redirigiendo a:', redirectUrl);
      try {
        window.sessionStorage.removeItem('mini_auth_redirect_url');
      } catch {
        // ignore storage failures
      }
      router.replace(redirectUrl);
    }
  }, [isSignedIn, router, redirectUrl]);

  // Login con OAuth (Google, Facebook, etc.)
  const signInWith = useCallback(
    async (strategy: OAuthStrategy) => {
      if (!signIn) {
        return;
      }

      if (loadingProvider || fetchStatus === 'fetching') {
        return;
      }
      console.log(
        '🔄 Iniciando sesión con OAuth:',
        strategy,
        '➡️ Redirigiendo a:',
        redirectUrl
      );

      try {
        setLoadingProvider(strategy);
        const { error } = await signIn.sso({
          strategy,
          redirectCallbackUrl: '/sign-in/sso-callback',
          redirectUrl,
          ...(strategy === 'oauth_google'
            ? { oidcPrompt: 'select_account' }
            : {}),
        });

        if (error) {
          setLoadingProvider(null);
          setErrors(toClerkApiErrors(error));
        }
      } catch (err) {
        setLoadingProvider(null);
        console.error('❌ Error en OAuth:', err);
        setErrors(toClerkApiErrors(err));
      }
    },
    [fetchStatus, loadingProvider, redirectUrl, signIn]
  );

  if (!isLoaded) {
    return <Loading />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);
    if (!signIn) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (error) {
        setErrors(toClerkApiErrors(error));
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace(redirectUrl);
      } else if (signIn.status === 'needs_second_factor') {
        setSecondFactor(true);
        setErrors([
          {
            code: 'needs_second_factor',
            message: 'Tu cuenta requiere verificación adicional.',
            longMessage:
              'Tu cuenta tiene verificación adicional activa en Clerk. Desactiva MFA para esa cuenta si no quieres pedir código al iniciar sesión.',
            meta: {},
          },
        ]);
      } else if (signIn.status === 'needs_client_trust') {
        setSecondFactor(false);
        setErrors([
          {
            code: 'needs_client_trust',
            message: 'Clerk requiere verificar este dispositivo.',
            longMessage:
              'Clerk está pidiendo un código porque Client Trust protege los inicios de sesión con contraseña desde dispositivos nuevos. Revísalo en el Dashboard de Clerk; si tu instancia no permite quitarlo, usa OAuth o completa la verificación.',
            meta: {},
          },
        ]);
      } else {
        setErrors([
          {
            code: 'unknown_error',
            message: 'Ocurrió un error desconocido',
            longMessage: 'Ocurrió un error desconocido',
            meta: {},
          },
        ]);
      }
    } catch (err) {
      setErrors(toClerkApiErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);

    try {
      if (!signIn) {
        return;
      }

      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });
      if (createError) {
        setErrors(toClerkApiErrors(createError));
        return;
      }

      const { error: sendCodeError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendCodeError) {
        setErrors(toClerkApiErrors(sendCodeError));
        return;
      }

      setSuccessfulCreation(true);
      setErrors(undefined);
    } catch (err) {
      setErrors(toClerkApiErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);

    try {
      if (!signIn) {
        setErrors([
          {
            code: 'sign_in_undefined',
            message: 'SignIn no está definido',
            longMessage: 'SignIn no está definido',
            meta: {},
          },
        ]);
        setIsSubmitting(false);
        return;
      }

      const verifyResult = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });
      if (verifyResult.error) {
        setErrors(toClerkApiErrors(verifyResult.error));
        return;
      }

      const submitResult = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });
      if (submitResult.error) {
        setErrors(toClerkApiErrors(submitResult.error));
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace(redirectUrl);
      } else if (signIn.status === 'needs_second_factor') {
        setSecondFactor(true);
        setErrors([
          {
            code: 'needs_second_factor',
            message: 'Tu cuenta requiere verificación adicional.',
            longMessage:
              'Tu cuenta tiene verificación adicional activa en Clerk. Desactiva MFA para esa cuenta si no quieres pedir código al iniciar sesión.',
            meta: {},
          },
        ]);
      } else if (signIn.status === 'needs_client_trust') {
        setSecondFactor(false);
        setErrors([
          {
            code: 'needs_client_trust',
            message: 'Clerk requiere verificar este dispositivo.',
            longMessage:
              'Clerk está pidiendo un código porque Client Trust protege los inicios de sesión con contraseña desde dispositivos nuevos. Revísalo en el Dashboard de Clerk; si tu instancia no permite quitarlo, usa OAuth o completa la verificación.',
            meta: {},
          },
        ]);
      } else {
        setErrors([
          {
            code: 'unknown_error',
            message: 'Ocurrió un error desconocido',
            longMessage: 'Ocurrió un error desconocido',
            meta: {},
          },
        ]);
      }
    } catch (err) {
      setErrors(toClerkApiErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailError = errors?.some(
    (error) =>
      error.code === 'form_identifier_not_found' ||
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'identifier') ||
      (error.code === 'form_param_format_invalid' &&
        error.meta?.paramName === 'identifier')
  );
  const passwordError = errors?.some(
    (error) =>
      error.code === 'form_password_incorrect' ||
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'password')
  );

  const inputClassName = (hasError?: boolean) => `
    h-12 w-full rounded-lg border bg-white/10 px-4 text-sm text-white
    placeholder:text-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
    outline-none transition
    ${
      hasError
        ? 'border-rose-400/80 focus:border-rose-300 focus:ring-2 focus:ring-rose-400/25'
        : 'border-white/15 hover:border-white/30 focus:border-cyan-300/80 focus:ring-2 focus:ring-cyan-300/25'
    }
  `;

  const primaryButtonClassName = `
    inline-flex h-12 w-full items-center justify-center rounded-lg
    bg-cyan-300 px-5 text-sm font-bold tracking-[0.08em] text-slate-950
    uppercase shadow-[0_18px_45px_rgba(103,232,249,0.28)]
    transition hover:bg-cyan-200 focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-cyan-200
    focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
    active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
  `;

  const secondaryButtonClassName = `
    inline-flex h-11 items-center justify-center rounded-lg border
    border-white/15 px-4 text-sm font-semibold text-white/85 transition
    hover:border-white/30 hover:bg-white/10 focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-cyan-300/40
    disabled:cursor-not-allowed disabled:opacity-60
  `;

  const oauthButtonClassName = `
    inline-flex size-12 items-center justify-center rounded-lg border
    border-white/15 bg-white/10 text-white transition hover:border-white/30
    hover:bg-white/15 focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-cyan-300/40
    active:scale-95 disabled:cursor-not-allowed disabled:opacity-60
  `;

  const linkButtonClassName = `
    text-sm font-semibold text-cyan-200 underline-offset-4 transition
    hover:text-white hover:underline focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-cyan-300/40
  `;

  const getErrorMessage = (error: ClerkAPIError) => {
    if (error.code === 'form_password_incorrect') {
      return 'Contraseña incorrecta. Inténtalo de nuevo o usa otro método.';
    }
    if (error.code === 'form_identifier_not_found') {
      return 'No se pudo encontrar tu cuenta.';
    }
    return error.longMessage;
  };

  const showForgotPassword = () => {
    setErrors(undefined);
    setCode('');
    setPassword('');
    setSuccessfulCreation(false);
    setIsForgotPassword(true);
  };

  const showSignIn = () => {
    setErrors(undefined);
    setCode('');
    setPassword('');
    setSuccessfulCreation(false);
    setIsForgotPassword(false);
  };

  const signUpQuery = [
    searchParams?.get('redirect_url')
      ? `redirect_url=${encodeURIComponent(searchParams.get('redirect_url')!)}`
      : '',
    planId ? `plan_id=${planId}` : '',
  ]
    .filter(Boolean)
    .join('&');

  const signUpHref = `/sign-up${signUpQuery ? `?${signUpQuery}` : ''}`;
  const isBusy = isSubmitting || fetchStatus === 'fetching';

  return (
    <div
      className="
        relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white
        sm:px-6
        lg:px-8
      "
    >
      <Image
        src="/login-fondo.webp"
        alt="Fondo de inicio de sesión"
        quality={100}
        fill
        sizes="100vw"
        priority
        style={{
          objectFit: 'cover',
        }}
      />
      <div
        className="
          pointer-events-none absolute inset-0 z-0
          bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.24),transparent_28%),linear-gradient(90deg,rgba(2,6,23,0.88),rgba(2,6,23,0.42)_48%,rgba(2,6,23,0.92))]
        "
      />
      <main
        className="
          relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl
          flex-col items-center justify-center gap-8
          lg:grid lg:grid-cols-[1fr_430px] lg:gap-12
        "
      >
        <div
          className="
            flex w-full max-w-2xl flex-col items-center text-center
            lg:items-start lg:text-left
          "
        >
          <AspectRatio ratio={16 / 9} className="relative w-full max-w-xl">
            <Image
              src="/logo-login.webp"
              alt="Logo de Artiefy"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              quality={100}
            />
          </AspectRatio>
          <div className="mt-4 max-w-xl">
            <p
              className="
                text-sm font-semibold tracking-[0.28em] text-cyan-200 uppercase
              "
            >
              Plataforma Artiefy
            </p>
            <h1
              className="
                mt-3 text-3xl font-black tracking-tight text-white
                sm:text-5xl
              "
            >
              Entra a tus cursos y proyectos sin pasos extra.
            </h1>
            <p
              className="
                mt-4 text-sm leading-6 text-white/70
                sm:text-base
              "
            >
              Correo y contraseña aparecen juntos. Si Clerk pide un código, la
              causa es una regla de seguridad de la instancia, no el diseño del
              formulario.
            </p>
          </div>
        </div>

        <div
          className="
            w-full max-w-[430px] rounded-lg border border-white/15
            bg-slate-950/75 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.5)]
            backdrop-blur-xl
            sm:p-8
          "
        >
          <div className="space-y-6">
            <div>
              <p
                className="
                  text-xs font-semibold tracking-[0.22em] text-cyan-200
                  uppercase
                "
              >
                Acceso seguro
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Usa tu correo y contraseña en un solo paso.
              </p>
            </div>

            {errors && (
              <ul
                className="
                  space-y-2 rounded-lg border border-rose-400/25 bg-rose-500/10
                  p-3
                "
              >
                {errors.map((el, index) => (
                  <li key={index} className="text-sm leading-5 text-rose-100">
                    {getErrorMessage(el)}
                  </li>
                ))}
              </ul>
            )}

            {!successfulCreation && !isForgotPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="
                      text-xs font-semibold tracking-[0.16em] text-white/70
                      uppercase
                    "
                  >
                    Correo electrónico
                  </label>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    required
                    className={inputClassName(emailError)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="
                      text-xs font-semibold tracking-[0.16em] text-white/70
                      uppercase
                    "
                  >
                    Contraseña
                  </label>
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    required
                    className={inputClassName(passwordError)}
                  />
                </div>

                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <Icons.spinner className="size-5" />
                  ) : (
                    <span>Entrar ahora</span>
                  )}
                </button>
              </form>
            ) : successfulCreation ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="new-password"
                    className="
                      text-xs font-semibold tracking-[0.16em] text-white/70
                      uppercase
                    "
                  >
                    Nueva contraseña
                  </label>
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    id="new-password"
                    name="new-password"
                    type="password"
                    value={password}
                    placeholder="Nueva contraseña"
                    autoComplete="new-password"
                    required
                    className={inputClassName(passwordError)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="reset-code"
                    className="
                      text-xs font-semibold tracking-[0.16em] text-white/70
                      uppercase
                    "
                  >
                    Código de restablecimiento
                  </label>
                  <input
                    onChange={(e) => setCode(e.target.value)}
                    id="reset-code"
                    name="reset-code"
                    type="text"
                    value={code}
                    placeholder="Código enviado a tu correo"
                    autoComplete="one-time-code"
                    required
                    className={inputClassName()}
                  />
                </div>

                <div
                  className="
                    grid gap-3
                    sm:grid-cols-[1fr_auto]
                  "
                >
                  <button
                    type="submit"
                    className={primaryButtonClassName}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Icons.spinner className="size-5" />
                    ) : (
                      <span>Restablecer</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={showSignIn}
                  >
                    Volver
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="forgot-email"
                    className="
                      text-xs font-semibold tracking-[0.16em] text-white/70
                      uppercase
                    "
                  >
                    Correo electrónico
                  </label>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    id="forgot-email"
                    name="forgot-email"
                    type="email"
                    value={email}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    required
                    className={inputClassName(emailError)}
                  />
                </div>

                <div
                  className="
                    grid gap-3
                    sm:grid-cols-[1fr_auto]
                  "
                >
                  <button
                    type="submit"
                    className={primaryButtonClassName}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Icons.spinner className="size-5" />
                    ) : (
                      <span>Enviar código</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={showSignIn}
                  >
                    Volver
                  </button>
                </div>
              </form>
            )}

            {secondFactor && (
              <p
                className="
                  rounded-lg border border-amber-300/25 bg-amber-300/10 p-3
                  text-sm leading-5 text-amber-100
                "
              >
                Clerk exige verificación adicional para esta cuenta. Esa regla
                se cambia en el Dashboard de Clerk.
              </p>
            )}

            <div className="space-y-4 border-t border-white/10 pt-5 text-center">
              <p
                className="
                  text-xs font-semibold tracking-[0.18em] text-white/50
                  uppercase
                "
              >
                O ingresa con
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => signInWith('oauth_google')}
                  className={oauthButtonClassName}
                  disabled={Boolean(loadingProvider)}
                  aria-label="Iniciar sesión con Google"
                >
                  {loadingProvider === 'oauth_google' ? (
                    <Icons.spinner className="size-5" />
                  ) : (
                    <Icons.google />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => signInWith('oauth_github')}
                  className={oauthButtonClassName}
                  disabled={Boolean(loadingProvider)}
                  aria-label="Iniciar sesión con GitHub"
                >
                  {loadingProvider === 'oauth_github' ? (
                    <Icons.spinner className="size-5" />
                  ) : (
                    <Icons.gitHub />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => signInWith('oauth_facebook')}
                  className={oauthButtonClassName}
                  disabled={Boolean(loadingProvider)}
                  aria-label="Iniciar sesión con Facebook"
                >
                  {loadingProvider === 'oauth_facebook' ? (
                    <Icons.spinner className="size-5" />
                  ) : (
                    <Icons.facebook />
                  )}
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-white/60">
                  ¿Aún no tienes cuenta?{' '}
                  <Link href={signUpHref} className={linkButtonClassName}>
                    Regístrate aquí
                  </Link>
                </p>
                <button
                  type="button"
                  onClick={showForgotPassword}
                  className={linkButtonClassName}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
