'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth, useClerk, useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/shared/types';
import { Eye, EyeOff } from 'lucide-react';

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

const TRANSIENT_OAUTH_ERROR_CODES = new Set([
  'oauth_timeout',
  'oauth_error',
  'oauth_in_progress',
]);

const hasTransientOAuthError = (errors?: ClerkAPIError[]) =>
  errors?.some((error) => TRANSIENT_OAUTH_ERROR_CODES.has(error.code)) ?? false;

// A half-completed login leaves a stale Clerk session in the browser; the
// next OAuth attempt then fails with one of these codes until it is cleared.
const STALE_SESSION_ERROR_CODES = new Set([
  'session_exists',
  'identifier_already_signed_in',
]);

const hasStaleSessionError = (errors: ClerkAPIError[]) =>
  errors.some((error) => STALE_SESSION_ERROR_CODES.has(error.code));

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const { signOut } = useClerk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(
    null
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthStartedAtRef = useRef(0);

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

  useEffect(() => {
    if (!loadingProvider) return;

    const timeoutId = window.setTimeout(() => {
      setLoadingProvider(null);
      setErrors([
        {
          code: 'oauth_timeout',
          message: 'No se pudo abrir OAuth. Inténtalo nuevamente.',
          longMessage:
            'No se pudo abrir OAuth. Inténtalo nuevamente con el mismo proveedor.',
          meta: {},
        },
      ]);
    }, 15000);

    return () => window.clearTimeout(timeoutId);
  }, [loadingProvider]);

  const clearTransientOAuthState = useCallback(() => {
    oauthStartedAtRef.current = 0;
    setLoadingProvider(null);
    setErrors((currentErrors) =>
      hasTransientOAuthError(currentErrors) ? undefined : currentErrors
    );
  }, []);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || oauthStartedAtRef.current > 0) {
        clearTransientOAuthState();
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        oauthStartedAtRef.current > 0
      ) {
        clearTransientOAuthState();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearTransientOAuthState]);

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
        setErrors(undefined);
        oauthStartedAtRef.current = Date.now();
        setLoadingProvider(strategy);

        signIn.reset();

        const startSso = () =>
          signIn.sso({
            strategy,
            redirectCallbackUrl: '/sign-in/sso-callback',
            redirectUrl,
            ...(strategy === 'oauth_google'
              ? { oidcPrompt: 'select_account' }
              : {}),
          });

        let { error } = await startSso();

        if (error && hasStaleSessionError(toClerkApiErrors(error))) {
          // Clear the stale session left by a half-completed login and retry
          // the OAuth redirect once, instead of forcing the user to wipe
          // browser cookies manually.
          await signOut(async () => {
            const retry = await startSso();
            error = retry.error;
          });
        }

        if (error) {
          oauthStartedAtRef.current = 0;
          setLoadingProvider(null);
          setErrors(toClerkApiErrors(error));
        }
      } catch (err) {
        oauthStartedAtRef.current = 0;
        setLoadingProvider(null);
        console.error('❌ Error en OAuth:', err);
        setErrors(toClerkApiErrors(err));
      }
    },
    [fetchStatus, loadingProvider, redirectUrl, signIn, signOut]
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
    w-full rounded-none bg-transparent px-4 py-2.5 text-sm text-white
    placeholder:text-white/55 ring-1 outline-hidden ring-inset transition
    sm:w-[250px] md:w-[300px] lg:w-[330px] xl:w-[350px]
    ${
      hasError
        ? 'ring-rose-400 focus:ring-rose-400'
        : 'ring-white/20 hover:ring-white/30 focus:ring-[1.5px] focus:ring-primary'
    }
  `;

  const passwordInputClassName = (hasError?: boolean) => `
    ${inputClassName(hasError)}
    pr-12
  `;

  const primaryButtonClassName = `
    group relative inline-flex h-[44px] min-w-[195px] items-center
    justify-center px-4 text-center text-[13px] font-bold tracking-[0.08em]
    text-primary/80 italic transition focus-visible:outline-[1.5px]
    focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95
    disabled:cursor-not-allowed disabled:opacity-60
  `;

  const secondaryButtonClassName = `
    inline-flex h-10 items-center justify-center px-4 text-sm font-bold
    text-primary/70 italic ring-1 ring-white/20 transition hover:bg-white/10
    focus-visible:outline-[1.5px] focus-visible:outline-offset-2
    focus-visible:outline-primary active:scale-95 disabled:opacity-60
  `;

  const oauthButtonClassName = `
    inline-flex size-12 items-center justify-center rounded-md bg-transparent p-2
    transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60
    focus-visible:outline-[1.5px] focus-visible:outline-offset-2
    focus-visible:outline-primary
  `;

  const linkButtonClassName = `
    font-medium text-primary underline-offset-4 outline-hidden transition
    hover:text-secondary hover:underline focus-visible:underline
  `;

  const getErrorMessage = (error: ClerkAPIError) => {
    if (error.code === 'form_password_incorrect') {
      return 'Contraseña incorrecta. Inténtalo de nuevo o usa otro método.';
    }
    if (error.code === 'form_identifier_not_found') {
      return 'No se pudo encontrar tu cuenta.';
    }
    if (error.code === 'oauth_timeout') {
      return 'No se pudo abrir OAuth. Inténtalo nuevamente.';
    }
    if (
      error.code === 'session_exists' ||
      error.code === 'identifier_already_signed_in'
    ) {
      return 'Había una sesión anterior sin cerrar. Ya la cerramos, inténtalo de nuevo.';
    }
    return error.longMessage;
  };

  const showForgotPassword = () => {
    setErrors(undefined);
    setCode('');
    setPassword('');
    setShowPassword(false);
    setSuccessfulCreation(false);
    setIsForgotPassword(true);
  };

  const showSignIn = () => {
    setErrors(undefined);
    setCode('');
    setPassword('');
    setShowPassword(false);
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
        relative flex min-h-screen flex-col items-center justify-center
        overflow-hidden px-4 text-white
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
          relative z-10 flex w-full flex-col items-center justify-center
          lg:flex-row lg:items-start lg:justify-between
        "
      >
        <div
          className="
            mb-8 w-full max-w-3/4
            max-md:mt-10
            md:max-w-2/4
            md:max-xl:mt-0
            lg:mb-0 lg:ml-30 lg:max-w-[700px] lg:self-center
            lg:max-xl:ml-5
          "
        >
          <AspectRatio ratio={16 / 9} className="relative size-full">
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
        </div>

        <div
          className="
            -mt-20 w-full max-w-md
            sm:-mt-16
            md:-mt-12
            lg:mt-0 lg:mr-15 lg:w-1/2 lg:max-w-[400px]
            xl:max-w-[500px]
          "
        >
          <div
            className="
              mx-auto w-full max-w-sm space-y-10 rounded-2xl px-8 py-10
              sm:max-w-md
            "
          >
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold">INICIAR SESIÓN</h2>
            </div>

            {errors && (
              <ul>
                {errors.map((el, index) => (
                  <li key={index} className="-my-4 text-sm text-rose-400">
                    {getErrorMessage(el)}
                  </li>
                ))}
              </ul>
            )}

            {!successfulCreation && !isForgotPassword ? (
              <form onSubmit={handleSubmit}>
                <div className="flex justify-center">
                  <label htmlFor="email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    placeholder="Correo Electrónico"
                    autoComplete="email"
                    required
                    className={inputClassName(emailError)}
                  />
                </div>

                <div className="mt-4 flex justify-center">
                  <label htmlFor="password" className="sr-only">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      onChange={(e) => setPassword(e.target.value)}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      placeholder="Contraseña"
                      autoComplete="current-password"
                      required
                      className={passwordInputClassName(passwordError)}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                      }
                      aria-pressed={showPassword}
                      className="
                        absolute top-1/2 right-3 inline-flex size-8
                        -translate-y-1/2 items-center justify-center
                        text-white/65 transition hover:text-primary
                        focus-visible:outline-[1.5px]
                        focus-visible:outline-offset-2
                        focus-visible:outline-primary
                      "
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    className={primaryButtonClassName}
                    disabled={isBusy}
                  >
                    <span
                      aria-hidden="true"
                      className="
                        pointer-events-none absolute inset-0 -skew-x-[18deg]
                        border border-white/20 bg-transparent transition-colors
                        duration-200 group-hover:border-white/30
                        group-hover:bg-white/10
                      "
                    />
                    <span
                      className="
                        relative flex w-full skew-x-[18deg] items-center
                        justify-center gap-3
                      "
                    >
                      {isBusy ? (
                        <Icons.spinner className="size-5" />
                      ) : (
                        <span
                          className="
                            inline-flex -skew-x-[8deg] items-center gap-2.5
                          "
                        >
                          <span>COMIENZA YA</span>
                          <span className="text-[1.2em] leading-none">→</span>
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            ) : successfulCreation ? (
              <form onSubmit={handleResetPassword}>
                <div className="flex justify-center">
                  <label htmlFor="new-password" className="sr-only">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      onChange={(e) => setPassword(e.target.value)}
                      id="new-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      placeholder="Nueva contraseña"
                      autoComplete="new-password"
                      required
                      className={passwordInputClassName(passwordError)}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                      }
                      aria-pressed={showPassword}
                      className="
                        absolute top-1/2 right-3 inline-flex size-8
                        -translate-y-1/2 items-center justify-center
                        text-white/65 transition hover:text-primary
                        focus-visible:outline-[1.5px]
                        focus-visible:outline-offset-2
                        focus-visible:outline-primary
                      "
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <label htmlFor="reset-code" className="sr-only">
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

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="submit"
                    className={primaryButtonClassName}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Icons.spinner className="size-5" />
                    ) : (
                      <span>RESTABLECER</span>
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
              <form onSubmit={handleForgotPassword}>
                <div className="flex justify-center">
                  <label htmlFor="forgot-email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    id="forgot-email"
                    name="forgot-email"
                    type="email"
                    value={email}
                    placeholder="Correo Electrónico"
                    autoComplete="email"
                    required
                    className={inputClassName(emailError)}
                  />
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="submit"
                    className={primaryButtonClassName}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Icons.spinner className="size-5" />
                    ) : (
                      <span>ENVIAR CÓDIGO</span>
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
              <p className="text-center text-sm text-amber-200">
                2FA es requerido, pero esta interfaz no lo maneja.
              </p>
            )}

            <div className="mt-4 text-center">
              <p>O ingresa con tu cuenta:</p>
              <div className="mt-2 flex justify-center space-x-4">
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

              <div className="mt-6 text-sm">
                <Link href={signUpHref} className={linkButtonClassName}>
                  ¿Aun no tienes cuenta? Registrate Aquí
                </Link>
              </div>
              <div className="mt-6 text-sm">
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
      </div>
    </div>
  );
}
