'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { useAuth, useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/types';

import { Icons } from '~/components/estudiantes/ui/icons';

import '../../../styles/mini-login-uiverse.css';

interface MiniLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  redirectUrl?: string;
}

export default function MiniLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  redirectUrl = '/',
}: MiniLoginModalProps) {
  const { signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(
    null
  );

  // Detectar cuando OAuth se completa exitosamente
  useEffect(() => {
    if (isSignedIn) {
      // Si el usuario está autenticado, cerrar todo
      if (loadingProvider) {
        setLoadingProvider(null);
      }
      onLoginSuccess();
      onClose();
    }
  }, [isSignedIn, loadingProvider, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  // OAuth login
  const signInWith = async (strategy: OAuthStrategy) => {
    if (!signIn) {
      setErrors([
        {
          code: 'sign_in_undefined',
          message: 'SignIn no está definido',
          meta: {},
        },
      ]);
      return;
    }

    try {
      setLoadingProvider(strategy);
      setErrors(undefined);

      // Construir URLs absolutas
      const baseUrl = window.location.origin;
      const absoluteRedirectUrl = `${baseUrl}/sign-in/sso-callback`;
      const absoluteRedirectUrlComplete = redirectUrl.startsWith('http')
        ? redirectUrl
        : `${baseUrl}${redirectUrl}`;

      // Abrir popup centrado
      const width = 500;
      const height = 650;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        'about:blank',
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,popup=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setLoadingProvider(null);
        setErrors([
          {
            code: 'popup_blocked',
            message: 'Popup bloqueado',
            longMessage:
              'Por favor, permite las ventanas emergentes en tu navegador para continuar.',
            meta: {},
          },
        ]);
        return;
      }

      // Monitorear el popup para detectar si se cierra manualmente
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          // Si el popup se cerró pero no hay autenticación, resetear
          if (!isSignedIn) {
            setLoadingProvider(null);
          }
        }
      }, 500);

      // Usar authenticateWithPopup
      await signIn.authenticateWithPopup({
        popup,
        strategy,
        redirectUrl: absoluteRedirectUrl,
        redirectUrlComplete: absoluteRedirectUrlComplete,
      });

      clearInterval(popupCheckInterval);

      // La autenticación se completó, el useEffect se encargará del resto
    } catch (err) {
      setLoadingProvider(null);
      console.error('❌ Error en OAuth:', err);

      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
      } else {
        setErrors([
          {
            code: 'oauth_error',
            message:
              err instanceof Error
                ? err.message
                : 'Error en el inicio de sesión con OAuth',
            longMessage:
              err instanceof Error
                ? err.message
                : 'Error en el inicio de sesión con OAuth',
            meta: {},
          },
        ]);
      }
    }
  };

  // Email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);
    if (!signIn) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        if (setActive) {
          await setActive({ session: signInAttempt.createdSessionId });
        }
        onLoginSuccess();
      } else if (signInAttempt.status === 'needs_first_factor') {
        const supportedStrategies =
          signInAttempt.supportedFirstFactors?.map(
            (factor) => factor.strategy
          ) ?? [];
        if (!supportedStrategies.includes('password')) {
          setErrors([
            {
              code: 'invalid_strategy',
              message: 'Estrategia de verificación inválida',
              longMessage: 'Estrategia de verificación inválida',
              meta: {},
            },
          ]);
        }
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
      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);

    try {
      if (!signIn) return;
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setSuccessfulCreation(true);
      setErrors(undefined);
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password
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
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        onLoginSuccess();
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
      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailError = errors?.some(
    (error) => error.code === 'form_identifier_not_found'
  );
  const passwordError = errors?.some(
    (error) => error.code === 'form_password_incorrect'
  );

  return (
    <div className="pointer-events-auto fixed inset-0 z-[1100] flex items-center justify-center bg-black/50">
      {/* OAuth Loading Overlay */}
      {loadingProvider && (
        <div className="absolute inset-0 z-[1150] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-background/95 p-8 shadow-2xl">
            <Icons.spinner className="h-12 w-12 text-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold">Autenticando...</p>
              <p className="text-sm text-muted-foreground">
                Completa el inicio de sesión en la ventana que se abrió
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        role="dialog"
        className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-[32px] border border-border/50 bg-background/95 p-8 shadow-lg backdrop-blur-xl duration-200 sm:max-w-md"
        tabIndex={-1}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Stars */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute h-1 w-1 animate-pulse rounded-full bg-accent/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            />
          ))}

          {/* Floating rockets */}
          <div className="animate-float absolute top-1/2 right-4 h-28 w-20 -translate-y-1/2 opacity-20">
            <div className="relative h-full w-full rotate-[-15deg]">
              <svg
                viewBox="0 0 64 80"
                className="h-full w-full drop-shadow-[0_0_15px_hsl(180_100%_50%/0.4)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="loginRocketGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="hsl(180 100% 40%)" />
                    <stop offset="100%" stopColor="hsl(190 100% 50%)" />
                  </linearGradient>
                  <linearGradient
                    id="loginRocketDark"
                    x1="100%"
                    y1="0%"
                    x2="0%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="hsl(200 100% 25%)" />
                    <stop offset="100%" stopColor="hsl(190 100% 35%)" />
                  </linearGradient>
                  <linearGradient
                    id="loginFlameGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="hsl(180 100% 60%)" />
                    <stop offset="50%" stopColor="hsl(40 100% 60%)" />
                    <stop offset="100%" stopColor="hsl(20 100% 50%)" />
                  </linearGradient>
                </defs>
                <path d="M32 4 L32 52 L16 52 Z" fill="url(#loginRocketDark)" />
                <path
                  d="M32 4 L32 52 L48 52 Z"
                  fill="url(#loginRocketGradient)"
                />
                <path
                  d="M32 8 L32 48"
                  stroke="hsl(180 100% 70% / 0.4)"
                  strokeWidth="1"
                />
                <g className="animate-flame origin-top">
                  <path
                    d="M24 52 L32 76 L40 52 Z"
                    fill="url(#loginFlameGradient)"
                    opacity="0.95"
                  />
                  <path
                    d="M28 52 L32 68 L36 52 Z"
                    fill="hsl(50 100% 75%)"
                    opacity="0.9"
                  />
                </g>
              </svg>
            </div>
          </div>

          <div
            className="animate-float absolute bottom-20 left-6 h-16 w-12 opacity-15"
            style={{ animationDelay: '1.5s' }}
          >
            <div className="relative h-full w-full rotate-[20deg]">
              <svg
                viewBox="0 0 64 80"
                className="h-full w-full drop-shadow-[0_0_10px_hsl(180_100%_50%/0.3)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M32 4 L32 52 L16 52 Z" fill="url(#loginRocketDark)" />
                <path
                  d="M32 4 L32 52 L48 52 Z"
                  fill="url(#loginRocketGradient)"
                />
                <g className="animate-flame origin-top">
                  <path
                    d="M24 52 L32 76 L40 52 Z"
                    fill="url(#loginFlameGradient)"
                    opacity="0.95"
                  />
                </g>
              </svg>
            </div>
          </div>

          {/* Floating particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className="animate-rise absolute h-1.5 w-1.5 rounded-full bg-gradient-to-b from-accent/60 to-orange-400/40"
              style={{
                left: `${20 + Math.random() * 60}%`,
                bottom: '-10px',
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${3 + Math.random() * 1.5}s`,
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-x h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center space-y-3 text-center sm:text-left">
          <h2 className="sr-only text-lg leading-none font-semibold tracking-tight">
            Iniciar sesión
          </h2>
          <p className="text-sm text-muted-foreground">Inicia sesión en:</p>
          <Image
            src="/artiefy-logo.png"
            alt="Artiefy"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        {/* Error messages */}
        {errors && (
          <div className="relative z-10 text-sm text-red-400">
            {errors.map((el, index) => (
              <p key={index}>
                {el.code === 'form_password_incorrect'
                  ? 'Contraseña incorrecta. Inténtalo de nuevo.'
                  : el.code === 'form_identifier_not_found'
                    ? 'No se pudo encontrar tu cuenta.'
                    : el.longMessage}
              </p>
            ))}
          </div>
        )}

        {!successfulCreation && !isForgotPassword ? (
          <form
            onSubmit={handleSubmit}
            className="relative z-10 mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="sr-only text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Correo electrónico
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                name="email"
                type="email"
                value={email}
                placeholder="Correo electrónico"
                required
                className={`flex h-12 w-full rounded-full border border-border/50 bg-[#1d283a]/80 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                  emailError ? 'border-red-300 focus:border-red-500' : ''
                }`}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="sr-only text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Contraseña
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                name="password"
                type="password"
                value={password}
                placeholder="Contraseña"
                required
                className={`flex h-12 w-full rounded-full border border-border/50 bg-[#1d283a]/80 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                  passwordError ? 'border-red-300 focus:border-red-500' : ''
                }`}
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary/80 to-primary px-4 py-2 text-sm font-semibold tracking-wide whitespace-nowrap text-[#080c16] ring-offset-background transition-all hover:from-primary hover:to-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Icons.spinner className="mx-auto h-5 w-5" />
              ) : (
                'INICIAR SESIÓN'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="h-[1px] w-full shrink-0 bg-border/50" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                o continúa con
              </span>
            </div>

            {/* OAuth buttons */}
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => signInWith('oauth_google')}
                className="inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-border/50 bg-background text-sm font-medium whitespace-nowrap ring-offset-background transition-all hover:border-primary/50 hover:bg-muted/50 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                disabled={!!loadingProvider}
                aria-label="Continuar con Google"
              >
                {loadingProvider === 'oauth_google' ? (
                  <Icons.spinner className="h-5 w-5" />
                ) : (
                  <Icons.google className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => signInWith('oauth_facebook')}
                className="inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-border/50 bg-background text-sm font-medium whitespace-nowrap ring-offset-background transition-all hover:border-primary/50 hover:bg-muted/50 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                disabled={!!loadingProvider}
                aria-label="Continuar con Facebook"
              >
                {loadingProvider === 'oauth_facebook' ? (
                  <Icons.spinner className="h-5 w-5" />
                ) : (
                  <Icons.facebook className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => signInWith('oauth_github')}
                className="inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-border/50 bg-background text-sm font-medium whitespace-nowrap ring-offset-background transition-all hover:border-primary/50 hover:bg-muted/50 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                disabled={!!loadingProvider}
                aria-label="Continuar con GitHub"
              >
                {loadingProvider === 'oauth_github' ? (
                  <Icons.spinner className="h-5 w-5" />
                ) : (
                  <Icons.gitHub className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Footer links */}
            <div className="mt-6 space-y-3 text-center">
              <div className="text-sm">
                <span className="text-muted-foreground">
                  ¿Olvidaste tu contraseña?{' '}
                </span>
                <button
                  type="button"
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                  onClick={() => setIsForgotPassword(true)}
                >
                  Recuperarla
                </button>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  ¿No tienes cuenta?{' '}
                </span>
                <button
                  type="button"
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                  onClick={() => {
                    const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;
                    window.location.href = signUpUrl;
                  }}
                >
                  Regístrate aquí
                </button>
              </div>
            </div>
          </form>
        ) : successfulCreation ? (
          <form
            onSubmit={handleResetPassword}
            className="relative z-10 mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="sr-only text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                required
                className="flex h-12 w-full rounded-full border border-border/50 bg-[#1d283a]/80 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="reset-code"
                className="sr-only text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Código de restablecimiento
              </label>
              <input
                onChange={(e) => setCode(e.target.value)}
                id="reset-code"
                name="reset-code"
                type="text"
                value={code}
                placeholder="Código de restablecimiento"
                required
                className="flex h-12 w-full rounded-full border border-border/50 bg-[#1d283a]/80 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary/80 to-primary px-4 py-2 text-sm font-semibold tracking-wide whitespace-nowrap text-primary-foreground ring-offset-background transition-all hover:from-primary hover:to-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Icons.spinner className="mx-auto h-5 w-5" />
              ) : (
                'RESTABLECER CONTRASEÑA'
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                onClick={() => {
                  setIsForgotPassword(false);
                  setSuccessfulCreation(false);
                  setErrors(undefined);
                }}
              >
                Volver a iniciar sesión
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleForgotPassword}
            className="relative z-10 mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="forgot-email"
                className="sr-only text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Correo electrónico
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                id="forgot-email"
                name="forgot-email"
                type="email"
                value={email}
                placeholder="Correo electrónico"
                required
                className="flex h-12 w-full rounded-full border border-border/50 bg-[#1d283a]/80 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary/80 to-primary px-4 py-2 text-sm font-semibold tracking-wide whitespace-nowrap text-primary-foreground ring-offset-background transition-all hover:from-primary hover:to-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Icons.spinner className="mx-auto h-5 w-5" />
              ) : (
                'ENVIAR CÓDIGO'
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                onClick={() => {
                  setIsForgotPassword(false);
                  setSuccessfulCreation(false);
                  setErrors(undefined);
                }}
              >
                Volver a iniciar sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
