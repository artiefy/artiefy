'use client';

import { useState } from 'react';

import Image from 'next/image';

import { useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/types';
import { FaTimes } from 'react-icons/fa';

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
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sign-up/sso-callback',
        redirectUrlComplete: redirectUrl,
      });
    } catch (err) {
      setLoadingProvider(null);
      console.error('❌ Error en OAuth:', err);
      setErrors([
        {
          code: 'oauth_error',
          message: 'Error en el inicio de sesión con OAuth',
          meta: {},
        },
      ]);
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
      <div className="mini-login relative w-full max-w-md px-4">
        <div className="form relative w-full">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 transition hover:text-white"
            type="button"
            aria-label="Cerrar"
          >
            <FaTimes className="h-5 w-5" />
          </button>

          <div className="mb-4 flex justify-center">
            <Image
              src="/artiefy-icon.png"
              alt="Artiefy"
              width={72}
              height={72}
              className="h-16 w-16 shadow-md"
              priority
            />
          </div>

          <div className="form-title">
            <span>Inicia sesión en</span>
          </div>
          <div className="title-2">
            <span>ARTIEFY</span>
          </div>

          {errors && (
            <div className="signup-link mb-3 text-red-300">
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
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <div className="input-container">
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    placeholder="Correo electrónico"
                    required
                    className={`input-mail ${
                      emailError ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                </div>

                <div className="input-container">
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    placeholder="Contraseña"
                    required
                    className={`input-pwd ${
                      passwordError ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                </div>
              </div>

              <section className="bg-stars" aria-hidden="true">
                <span className="star" />
                <span className="star" />
                <span className="star" />
                <span className="star" />
              </section>

              <button type="submit" className="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Icons.spinner className="mx-auto h-5 w-5" />
                ) : (
                  <span className="sign-text">Iniciar sesión</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => signInWith('oauth_google')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white"
                  disabled={!!loadingProvider}
                  aria-label="Continuar con Google"
                >
                  {loadingProvider === 'oauth_google' ? (
                    <Icons.spinner className="h-5 w-5" />
                  ) : (
                    <Icons.google />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => signInWith('oauth_facebook')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white"
                  disabled={!!loadingProvider}
                  aria-label="Continuar con Facebook"
                >
                  {loadingProvider === 'oauth_facebook' ? (
                    <Icons.spinner className="h-5 w-5" />
                  ) : (
                    <Icons.facebook />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => signInWith('oauth_github')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white"
                  disabled={!!loadingProvider}
                  aria-label="Continuar con GitHub"
                >
                  {loadingProvider === 'oauth_github' ? (
                    <Icons.spinner className="h-5 w-5" />
                  ) : (
                    <Icons.gitHub />
                  )}
                </button>
              </div>

              <p className="signup-link">
                ¿Olvidaste tu contraseña?
                <button
                  type="button"
                  className="up ml-1"
                  onClick={() => setIsForgotPassword(true)}
                >
                  Recuperarla
                </button>
              </p>

              <p className="signup-link">
                ¿No tienes cuenta?
                <button
                  type="button"
                  className="up ml-1"
                  onClick={() => {
                    const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;
                    window.location.href = signUpUrl;
                  }}
                >
                  Regístrate aquí
                </button>
              </p>
            </form>
          ) : successfulCreation ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="input-container">
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  id="new-password"
                  name="new-password"
                  type="password"
                  value={password}
                  placeholder="Nueva contraseña"
                  required
                  className="input-pwd"
                />
              </div>
              <div className="input-container">
                <input
                  onChange={(e) => setCode(e.target.value)}
                  id="reset-code"
                  name="reset-code"
                  type="text"
                  value={code}
                  placeholder="Código de restablecimiento"
                  required
                  className="input-mail"
                />
              </div>
              <button type="submit" className="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Icons.spinner className="mx-auto h-5 w-5" />
                ) : (
                  <span className="sign-text">Restablecer contraseña</span>
                )}
              </button>
              <p className="signup-link">
                <button
                  type="button"
                  className="up"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setSuccessfulCreation(false);
                    setErrors(undefined);
                  }}
                >
                  Volver a iniciar sesión
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="input-container">
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  id="forgot-email"
                  name="forgot-email"
                  type="email"
                  value={email}
                  placeholder="Correo electrónico"
                  required
                  className="input-mail"
                />
              </div>
              <button type="submit" className="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Icons.spinner className="mx-auto h-5 w-5" />
                ) : (
                  <span className="sign-text">Enviar código</span>
                )}
              </button>
              <p className="signup-link">
                <button
                  type="button"
                  className="up"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setSuccessfulCreation(false);
                    setErrors(undefined);
                  }}
                >
                  Volver a iniciar sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
