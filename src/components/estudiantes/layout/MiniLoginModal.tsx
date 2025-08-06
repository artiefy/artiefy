'use client';

import { useState } from 'react';

import { useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/types';
import { FaTimes } from 'react-icons/fa';

import { Icons } from '~/components/estudiantes/ui/icons';

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
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            Iniciar Sesión para Continuar
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Error Messages */}
        {errors && (
          <div className="mb-4">
            {errors.map((el, index) => (
              <p key={index} className="text-sm text-red-500">
                {el.code === 'form_password_incorrect'
                  ? 'Contraseña incorrecta. Inténtalo de nuevo.'
                  : el.code === 'form_identifier_not_found'
                    ? 'No se pudo encontrar tu cuenta.'
                    : el.longMessage}
              </p>
            ))}
          </div>
        )}

        {/* Form Content */}
        <div className="space-y-4">
          {!successfulCreation && !isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  placeholder="Correo Electrónico"
                  required
                  className={`w-full border px-3 py-2 text-sm text-gray-500 focus:outline-none ${
                    emailError
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-secondary focus:border-secondary'
                  }`}
                />
              </div>
              <div>
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  placeholder="Contraseña"
                  required
                  className={`w-full border px-3 py-2 text-sm text-gray-500 focus:outline-none ${
                    passwordError
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-secondary focus:border-secondary'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="border-secondary bg-secondary w-full border px-4 py-2 text-white transition-colors hover:border-[#00A5C0] hover:bg-[#00A5C0] focus:outline-none disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Icons.spinner className="mx-auto h-5 w-5" />
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          ) : successfulCreation ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  id="new-password"
                  name="new-password"
                  type="password"
                  value={password}
                  placeholder="Nueva Contraseña"
                  required
                  className="border-secondary focus:border-secondary w-full border px-3 py-2 text-sm text-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  onChange={(e) => setCode(e.target.value)}
                  id="reset-code"
                  name="reset-code"
                  type="text"
                  value={code}
                  placeholder="Código de Restablecimiento"
                  required
                  className="border-secondary focus:border-secondary w-full border px-3 py-2 text-sm text-gray-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="border-secondary bg-secondary w-full border px-4 py-2 text-white transition-colors hover:border-[#00A5C0] hover:bg-[#00A5C0] focus:outline-none disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Icons.spinner className="mx-auto h-5 w-5" />
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  id="forgot-email"
                  name="forgot-email"
                  type="email"
                  value={email}
                  placeholder="Correo Electrónico"
                  required
                  className="border-secondary focus:border-secondary w-full border px-3 py-2 text-sm text-gray-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="border-secondary bg-secondary w-full border px-4 py-2 text-white transition-colors hover:border-[#00A5C0] hover:bg-[#00A5C0] focus:outline-none disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Icons.spinner className="mx-auto h-5 w-5" />
                ) : (
                  'Enviar Código'
                )}
              </button>
            </form>
          )}

          {/* OAuth Providers */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => signInWith('oauth_google')}
                className="border-secondary flex items-center justify-center border bg-white p-2 hover:bg-gray-50"
                disabled={!!loadingProvider}
              >
                {loadingProvider === 'oauth_google' ? (
                  <Icons.spinner className="h-5 w-5" />
                ) : (
                  <Icons.google />
                )}
              </button>
              <button
                type="button"
                onClick={() => signInWith('oauth_github')}
                className="border-secondary flex items-center justify-center border bg-white p-2 hover:bg-gray-50"
                disabled={!!loadingProvider}
              >
                {loadingProvider === 'oauth_github' ? (
                  <Icons.spinner className="h-5 w-5" />
                ) : (
                  <Icons.gitHub />
                )}
              </button>
              <button
                type="button"
                onClick={() => signInWith('oauth_facebook')}
                className="border-secondary flex items-center justify-center border bg-white p-2 hover:bg-gray-50"
                disabled={!!loadingProvider}
              >
                {loadingProvider === 'oauth_facebook' ? (
                  <Icons.spinner className="h-5 w-5" />
                ) : (
                  <Icons.facebook />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          {!successfulCreation && !isForgotPassword && (
            <div className="mt-4 space-y-2 text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-secondary text-sm hover:text-[#00A5C0]"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    // Redirigir al registro con la URL de redirección actual
                    const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;
                    window.location.href = signUpUrl;
                  }}
                  className="text-secondary text-sm font-medium hover:text-[#00A5C0]"
                >
                  ¿No tienes cuenta? Regístrate aquí
                </button>
              </div>
            </div>
          )}

          {/* Back to Login */}
          {(successfulCreation || isForgotPassword) && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setSuccessfulCreation(false);
                  setErrors(undefined);
                }}
                className="text-secondary text-sm hover:text-[#00A5C0]"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
